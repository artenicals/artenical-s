/*
  ============================================================
  CONFIGURACIÓN
  ============================================================
  1. Crea un proyecto en Supabase.
  2. Copia Project URL y Publishable key desde Settings > API.
  3. Pégalos aquí.
  4. Ejecuta supabase.sql en el SQL Editor.
*/

const SUPABASE_URL = "https://zyqcueyaqknkvmdiahhi.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_EQOxmc4J08cv67p7xFksJQ_Y0iaYRug";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);

const authView = document.getElementById("authView");
const appView = document.getElementById("appView");
const loginForm = document.getElementById("loginForm");
const signupForm = document.getElementById("signupForm");
const signupBox = document.getElementById("signupBox");
const authMessage = document.getElementById("authMessage");

const profileDialog = document.getElementById("profileDialog");
const profileForm = document.getElementById("profileForm");

let currentUser = null;
let profile = null;
let selectedFile = null;
let selectedFileType = null;
let isPublicView = false;
let viewedUserId = null;

const params = new URLSearchParams(window.location.search);
const publicUsername = (params.get("u") || "").replace(/^@/, "").trim().toLowerCase() || null;

const $ = (id) => document.getElementById(id);

function setMessage(element, text, ok = false) {
  element.textContent = text || "";
  element.style.color = ok ? "#6a9a70" : "#b55385";
}

function escapeHtml(value = "") {
  return value.replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[char]));
}

function formatDate(dateString) {
  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(dateString));
}

function placeholderAvatar() {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="400" height="400">
      <rect width="400" height="400" rx="120" fill="#ffd1e6"/>
      <circle cx="200" cy="180" r="72" fill="#fff9df"/>
      <circle cx="172" cy="172" r="9" fill="#514c5d"/>
      <circle cx="228" cy="172" r="9" fill="#514c5d"/>
      <path d="M170 210 Q200 235 230 210" fill="none" stroke="#514c5d" stroke-width="10" stroke-linecap="round"/>
      <circle cx="105" cy="120" r="25" fill="#f08ac1"/>
      <circle cx="295" cy="120" r="25" fill="#f08ac1"/>
      <text x="200" y="330" text-anchor="middle" font-family="sans-serif" font-size="42" font-weight="700" fill="#f08ac1">♡</text>
    </svg>`;
  return "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svg);
}

function showAuth() {
  authView.classList.remove("hidden");
  appView.classList.add("hidden");
}

function showApp() {
  authView.classList.add("hidden");
  appView.classList.remove("hidden");
}

function setPublicMode(enabled) {
  isPublicView = enabled;
  const ownerOnly = [
    "editCoverBtn",
    "editAvatarBtn",
    "editProfileBtn",
    "logoutBtn",
    "composer",
    "copyLinkBtn"
  ];

  ownerOnly.forEach(id => {
    const el = $(id);
    if (!el) return;
    if (id === "composer") {
      el.classList.toggle("hidden", enabled);
    } else if (id === "copyLinkBtn") {
      // el botón de copiar link solo se ve cuando TÚ estás logueada
      el.classList.toggle("hidden", enabled);
    } else {
      el.classList.toggle("hidden", enabled);
    }
  });

  const badge = $("publicBadge");
  if (badge) badge.classList.toggle("hidden", !enabled);
}

function getPublicProfileUrl() {
  if (!profile?.username) return window.location.origin + window.location.pathname;
  const u = profile.username.replace(/^@/, "");
  return `${window.location.origin}${window.location.pathname}?u=${encodeURIComponent(u)}`;
}

async function getSignedUrl(path) {
  if (!path) return null;
  const { data, error } = await supabaseClient.storage
    .from("media")
    .createSignedUrl(path, 60 * 60);
  if (error) {
    console.error(error);
    return null;
  }
  return data.signedUrl;
}

async function loadProfile() {
  const { data, error } = await supabaseClient
    .from("profiles")
    .select("*")
    .eq("id", currentUser.id)
    .maybeSingle();

  if (error) throw error;

  if (!data) {
    const { data: created, error: insertError } = await supabaseClient
      .from("profiles")
      .insert({
        id: currentUser.id,
        name: currentUser.user_metadata?.name || "Mi nombre",
        username: currentUser.user_metadata?.username || "yo",
        bio: "Mi pequeño rincón de internet ♡"
      })
      .select()
      .single();

    if (insertError) throw insertError;
    profile = created;
  } else {
    profile = data;
  }

  viewedUserId = profile.id;
  await renderProfile();
}

async function loadPublicProfile(username) {
  const { data, error } = await supabaseClient
    .from("profiles")
    .select("*")
    .ilike("username", username)
    .maybeSingle();

  if (error) throw error;
  if (!data) {
    throw new Error("No se encontró este perfil.");
  }

  profile = data;
  viewedUserId = data.id;
  await renderProfile();
}

async function renderProfile() {
  const avatarUrl = await getSignedUrl(profile.avatar_path);
  const coverUrl = await getSignedUrl(profile.cover_path);

  $("profileName").textContent = profile.name || "Mi nombre";
  $("profileUsername").textContent = profile.username ? `@${profile.username.replace(/^@/, "")}` : "@yo";
  $("profileBio").textContent = profile.bio || "Escribe algo bonito sobre ti ♡";
  $("avatarImg").src = avatarUrl || placeholderAvatar();

  if ($("composerAvatar")) {
    $("composerAvatar").src = avatarUrl || placeholderAvatar();
  }
  if ($("composerName")) {
    $("composerName").textContent = profile.name || "Tú";
  }

  const cover = $("cover");
  if (coverUrl) {
    cover.style.backgroundImage = `url("${coverUrl}")`;
    cover.style.backgroundSize = "cover";
    cover.style.backgroundPosition = "center";
  } else {
    cover.style.backgroundImage = "";
  }

  if (profile.created_at) {
    $("joinedDate").textContent = new Intl.DateTimeFormat("es-MX", {
      month: "short",
      year: "numeric"
    }).format(new Date(profile.created_at));
  }
}

async function loadPosts() {
  if (!viewedUserId) return;

  const { data, error } = await supabaseClient
    .from("posts")
    .select("*")
    .eq("user_id", viewedUserId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    return;
  }

  $("postCount").textContent = data.length;
  const list = $("feedList");

  if (!data.length) {
    list.innerHTML = `
      <div class="empty-feed">
        <div style="font-size:42px">🌷</div>
        <strong>Aún no hay publicaciones</strong>
        <div>${isPublicView ? "Este espacio todavía está vacío ♡" : "Escribe algo arriba y empieza tu rinconcito ♡"}</div>
      </div>`;
    return;
  }

  const avatarUrl = await getSignedUrl(profile.avatar_path);

  const postHtml = await Promise.all(data.map(async post => {
    const mediaUrl = await getSignedUrl(post.media_path);
    const media = mediaUrl
      ? `<img class="post-media" src="${mediaUrl}" alt="Imagen de la publicación" loading="lazy">`
      : "";

    const deleteBtn = isPublicView
      ? ""
      : `<button class="delete-post" data-delete="${post.id}">borrar ×</button>`;

    return `
      <article class="post">
        <div class="post-head">
          <img class="post-avatar" src="${avatarUrl || placeholderAvatar()}" alt="">
          <div class="post-meta">
            <strong>${escapeHtml(profile.name || "Tú")}</strong>
            <small>${formatDate(post.created_at)}</small>
          </div>
          ${deleteBtn}
        </div>
        ${post.content ? `<div class="post-body">${escapeHtml(post.content)}</div>` : ""}
        ${media}
      </article>`;
  }));

  list.innerHTML = postHtml.join("");

  if (!isPublicView) {
    list.querySelectorAll("[data-delete]").forEach(btn => {
      btn.addEventListener("click", () => deletePost(btn.dataset.delete));
    });
  }
}

async function uploadFile(file, folder) {
  const extension = (file.name.split(".").pop() || "bin").toLowerCase();
  const fileName = `${crypto.randomUUID()}.${extension}`;
  const path = `${currentUser.id}/${folder}/${fileName}`;

  const { error } = await supabaseClient.storage
    .from("media")
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type
    });

  if (error) throw error;
  return path;
}

async function deleteStorageFile(path) {
  if (!path) return;
  const { error } = await supabaseClient.storage.from("media").remove([path]);
  if (error) console.warn("No se pudo borrar el archivo:", error);
}

async function publishPost() {
  if (isPublicView || !currentUser) return;

  const content = $("postText").value;
  const btn = $("publishBtn");

  if (!content.trim() && !selectedFile) {
    setMessage($("publishMessage"), "Escribe algo o agrega una foto/GIF ♡");
    return;
  }

  btn.disabled = true;
  btn.textContent = "publicando...";

  try {
    let mediaPath = null;
    if (selectedFile) {
      mediaPath = await uploadFile(selectedFile, "posts");
    }

    const { error } = await supabaseClient.from("posts").insert({
      user_id: currentUser.id,
      content,
      media_path: mediaPath,
      media_type: selectedFileType
    });

    if (error) {
      if (mediaPath) await deleteStorageFile(mediaPath);
      throw error;
    }

    $("postText").value = "";
    clearSelectedMedia();
    setMessage($("publishMessage"), "Publicado ♡", true);
    await loadPosts();
  } catch (error) {
    console.error(error);
    setMessage($("publishMessage"), error.message || "No se pudo publicar.");
  } finally {
    btn.disabled = false;
    btn.textContent = "publicar ♡";
  }
}

async function deletePost(id) {
  if (isPublicView || !currentUser) return;
  if (!confirm("¿Borrar esta publicación?")) return;

  const { data, error: findError } = await supabaseClient
    .from("posts")
    .select("media_path")
    .eq("id", id)
    .single();

  if (findError) {
    alert(findError.message);
    return;
  }

  const { error } = await supabaseClient
    .from("posts")
    .delete()
    .eq("id", id);

  if (error) {
    alert(error.message);
    return;
  }

  if (data?.media_path) await deleteStorageFile(data.media_path);
  await loadPosts();
}

function previewFile(file, type) {
  selectedFile = file;
  selectedFileType = type;

  const url = URL.createObjectURL(file);
  $("selectedPreview").src = url;
  $("selectedMedia").classList.remove("hidden");
}

function clearSelectedMedia() {
  selectedFile = null;
  selectedFileType = null;
  $("photoInput").value = "";
  $("gifInput").value = "";
  $("selectedPreview").src = "";
  $("selectedMedia").classList.add("hidden");
}

async function updateProfile(data) {
  if (isPublicView || !currentUser) return;

  const { data: updated, error } = await supabaseClient
    .from("profiles")
    .update(data)
    .eq("id", currentUser.id)
    .select()
    .single();

  if (error) throw error;
  profile = updated;
  await renderProfile();
}

async function changeAvatar(file) {
  if (!file || isPublicView || !currentUser) return;
  try {
    const oldPath = profile.avatar_path;
    const newPath = await uploadFile(file, "avatar");
    await updateProfile({ avatar_path: newPath });
    if (oldPath) await deleteStorageFile(oldPath);
  } catch (error) {
    alert(error.message || "No se pudo cambiar la foto.");
  }
}

async function changeCover(file) {
  if (!file || isPublicView || !currentUser) return;
  try {
    const oldPath = profile.cover_path;
    const newPath = await uploadFile(file, "cover");
    await updateProfile({ cover_path: newPath });
    if (oldPath) await deleteStorageFile(oldPath);
  } catch (error) {
    alert(error.message || "No se pudo cambiar la portada.");
  }
}

async function openProfileEditor() {
  if (isPublicView || !currentUser) return;
  $("editName").value = profile.name || "";
  $("editUsername").value = profile.username || "";
  $("editBio").value = profile.bio || "";
  $("profileMessage").textContent = "";
  profileDialog.showModal();
}

async function copyPublicLink() {
  const url = getPublicProfileUrl();
  try {
    await navigator.clipboard.writeText(url);
    setMessage($("publishMessage") || $("authMessage"), "Link copiado ♡", true);
    alert("Link de tu perfil copiado:\n" + url);
  } catch {
    prompt("Copia este link de tu perfil:", url);
  }
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  setMessage(authMessage, "entrando...");

  const email = $("loginEmail").value.trim();
  const password = $("loginPassword").value;

  const { error } = await supabaseClient.auth.signInWithPassword({ email, password });

  if (error) {
    setMessage(authMessage, error.message);
    return;
  }
  setMessage(authMessage, "");
});

signupForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  setMessage(authMessage, "creando cuenta...");

  const email = $("signupEmail").value.trim();
  const password = $("signupPassword").value;

  const { error } = await supabaseClient.auth.signUp({
    email,
    password,
    options: {
      data: { name: "Mi nombre", username: "yo" }
    }
  });

  if (error) {
    setMessage(authMessage, error.message);
    return;
  }

  setMessage(authMessage, "Cuenta creada. Revisa tu correo si Supabase solicita confirmación.", true);
});

$("showSignup").addEventListener("click", () => {
  signupBox.classList.add("hidden");
  loginForm.classList.add("hidden");
  signupForm.classList.remove("hidden");
});

$("cancelSignup").addEventListener("click", () => {
  signupForm.classList.add("hidden");
  loginForm.classList.remove("hidden");
  signupBox.classList.remove("hidden");
});

$("logoutBtn").addEventListener("click", async () => {
  await supabaseClient.auth.signOut();
});

$("publishBtn").addEventListener("click", publishPost);

$("photoInput").addEventListener("change", (event) => {
  const file = event.target.files?.[0];
  if (file) previewFile(file, "image");
});

$("gifInput").addEventListener("change", (event) => {
  const file = event.target.files?.[0];
  if (file) previewFile(file, "gif");
});

$("removeMedia").addEventListener("click", clearSelectedMedia);

$("editProfileBtn").addEventListener("click", openProfileEditor);

if ($("copyLinkBtn")) {
  $("copyLinkBtn").addEventListener("click", copyPublicLink);
}

profileForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  try {
    await updateProfile({
      name: $("editName").value.trim(),
      username: $("editUsername").value.trim().replace(/^@/, ""),
      bio: $("editBio").value.trim()
    });

    setMessage($("profileMessage"), "Guardado ♡", true);
    setTimeout(() => profileDialog.close(), 450);
  } catch (error) {
    setMessage($("profileMessage"), error.message);
  }
});

document.querySelectorAll("[data-close]").forEach(btn => {
  btn.addEventListener("click", () => profileDialog.close());
});

$("editAvatarBtn").addEventListener("click", () => $("avatarFileInput").click());
$("editCoverBtn").addEventListener("click", () => $("coverFileInput").click());

$("avatarFileInput").addEventListener("change", async (event) => {
  await changeAvatar(event.target.files?.[0]);
  event.target.value = "";
});

$("coverFileInput").addEventListener("change", async (event) => {
  await changeCover(event.target.files?.[0]);
  event.target.value = "";
});

async function enterPrivateMode() {
  setPublicMode(false);
  try {
    await loadProfile();
    showApp();
    await loadPosts();
  } catch (error) {
    console.error(error);
    setMessage(authMessage, error.message || "No se pudo cargar tu espacio.");
    showAuth();
  }
}

async function enterPublicMode(username) {
  setPublicMode(true);
  try {
    await loadPublicProfile(username);
    showApp();
    await loadPosts();
  } catch (error) {
    console.error(error);
    setMessage(authMessage, error.message || "No se pudo cargar este perfil.");
    showAuth();
  }
}

supabaseClient.auth.onAuthStateChange(async (event, session) => {
  if (session?.user) {
    currentUser = session.user;
    // Si entraste con ?u=... pero estás logueada, ves TU espacio (no el público)
    await enterPrivateMode();
  } else {
    currentUser = null;
    profile = null;
    viewedUserId = null;

    if (publicUsername) {
      await enterPublicMode(publicUsername);
    } else {
      setPublicMode(false);
      showAuth();
    }
  }
});

(async function init() {
  const { data } = await supabaseClient.auth.getSession();
  if (!data.session) {
    if (publicUsername) {
      await enterPublicMode(publicUsername);
    } else {
      showAuth();
    }
  }
})();
