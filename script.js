// --- Supabase bağlantısı ---
// Bu iki değer herkese açıktır (gizli değildir); güvenlik veritabanındaki
// RLS kuralları ile sağlanır. Her kullanıcı yalnızca kendi görevlerini görür.
const SUPABASE_URL = "https://sywrqimvyjksbyhdgpys.supabase.co";
const SUPABASE_KEY = "sb_publishable_1wOV5QjP1JVA3b4EsF_m-Q_qx1R4X5z";

const db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// --- DOM elemanları ---
const authView = document.getElementById("auth-view");
const appView = document.getElementById("app-view");
const authForm = document.getElementById("auth-form");
const authEmail = document.getElementById("auth-email");
const authPassword = document.getElementById("auth-password");
const signupBtn = document.getElementById("signup-btn");
const authMessage = document.getElementById("auth-message");
const userEmail = document.getElementById("user-email");
const logoutBtn = document.getElementById("logout-btn");

const form = document.getElementById("todo-form");
const input = document.getElementById("todo-input");
const list = document.getElementById("todo-list");
const count = document.getElementById("count");
const clearDoneBtn = document.getElementById("clear-done");
const filterBtns = document.querySelectorAll(".filter");

let todos = [];
let filter = "all";

// ============ KİMLİK DOĞRULAMA (AUTH) ============

function showMessage(text, type) {
  authMessage.textContent = text;
  authMessage.className = "auth-message " + (type || "");
}

// Giriş yap
authForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  showMessage("Giriş yapılıyor...");
  const { error } = await db.auth.signInWithPassword({
    email: authEmail.value.trim(),
    password: authPassword.value,
  });
  if (error) showMessage("Giriş başarısız: " + cevir(error.message), "error");
});

// Kaydol
signupBtn.addEventListener("click", async () => {
  if (!authEmail.value.trim() || authPassword.value.length < 6) {
    return showMessage("E-posta gir ve en az 6 karakterlik şifre seç.", "error");
  }
  showMessage("Hesap oluşturuluyor...");
  const { error } = await db.auth.signUp({
    email: authEmail.value.trim(),
    password: authPassword.value,
  });
  if (error) showMessage("Kayıt başarısız: " + cevir(error.message), "error");
  else showMessage("Hesap oluşturuldu, giriş yapılıyor...", "success");
});

// Çıkış yap
logoutBtn.addEventListener("click", () => db.auth.signOut());

// Sık görülen hata mesajlarını Türkçeleştir
function cevir(msg) {
  if (/invalid login credentials/i.test(msg)) return "E-posta veya şifre hatalı.";
  if (/already registered/i.test(msg)) return "Bu e-posta zaten kayıtlı.";
  if (/password should be at least/i.test(msg)) return "Şifre çok kısa.";
  return msg;
}

// Giriş durumu değişince ekranı güncelle
db.auth.onAuthStateChange((_event, session) => {
  if (session) {
    authView.hidden = true;
    appView.hidden = false;
    userEmail.textContent = session.user.email;
    authForm.reset();
    load();
  } else {
    appView.hidden = true;
    authView.hidden = false;
    todos = [];
  }
});

// ============ GÖREVLER (TODOS) ============

async function load() {
  const { data, error } = await db
    .from("todos")
    .select("*")
    .order("inserted_at", { ascending: true });

  if (error) {
    console.error("Görevler yüklenemedi:", error);
    list.innerHTML = '<li class="empty">⚠️ Görevler yüklenemedi.</li>';
    return;
  }
  todos = data;
  render();
}

function render() {
  list.innerHTML = "";

  const visible = todos.filter((t) => {
    if (filter === "active") return !t.done;
    if (filter === "done") return t.done;
    return true;
  });

  if (visible.length === 0) {
    const li = document.createElement("li");
    li.className = "empty";
    li.textContent = "Henüz görev yok 🎉";
    list.appendChild(li);
  }

  visible.forEach((todo) => {
    const li = document.createElement("li");
    li.className = "todo-item" + (todo.done ? " done" : "");

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = todo.done;
    checkbox.addEventListener("change", () => toggle(todo));

    const span = document.createElement("span");
    span.className = "text";
    span.textContent = todo.text;

    const del = document.createElement("button");
    del.className = "delete";
    del.textContent = "×";
    del.title = "Sil";
    del.addEventListener("click", () => remove(todo.id));

    li.append(checkbox, span, del);
    list.appendChild(li);
  });

  const remaining = todos.filter((t) => !t.done).length;
  count.textContent = `${remaining} görev kaldı`;
}

// Yeni görev ekle (user_id veritabanında otomatik atanır)
async function addTodo(text) {
  const { data, error } = await db
    .from("todos")
    .insert({ text, done: false })
    .select()
    .single();

  if (error) return console.error("Eklenemedi:", error);
  todos.push(data);
  render();
}

async function toggle(todo) {
  const { data, error } = await db
    .from("todos")
    .update({ done: !todo.done })
    .eq("id", todo.id)
    .select()
    .single();

  if (error) return console.error("Güncellenemedi:", error);
  const idx = todos.findIndex((t) => t.id === todo.id);
  todos[idx] = data;
  render();
}

async function remove(id) {
  const { error } = await db.from("todos").delete().eq("id", id);
  if (error) return console.error("Silinemedi:", error);
  todos = todos.filter((t) => t.id !== id);
  render();
}

async function clearDone() {
  const { error } = await db.from("todos").delete().eq("done", true);
  if (error) return console.error("Temizlenemedi:", error);
  todos = todos.filter((t) => !t.done);
  render();
}

// --- Olaylar ---
form.addEventListener("submit", (e) => {
  e.preventDefault();
  const text = input.value.trim();
  if (!text) return;
  addTodo(text);
  input.value = "";
  input.focus();
});

clearDoneBtn.addEventListener("click", clearDone);

filterBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    filterBtns.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    filter = btn.dataset.filter;
    render();
  });
});
