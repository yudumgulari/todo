// --- Supabase bağlantısı ---
// Bu iki değer herkese açıktır (gizli değildir); güvenlik veritabanındaki
// RLS kuralları ile sağlanır. Bu uygulamada giriş yok, herkes aynı listeyi paylaşır.
const SUPABASE_URL = "https://sywrqimvyjksbyhdgpys.supabase.co";
const SUPABASE_KEY = "sb_publishable_1wOV5QjP1JVA3b4EsF_m-Q_qx1R4X5z";

const db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// --- DOM elemanları ---
const form = document.getElementById("todo-form");
const input = document.getElementById("todo-input");
const list = document.getElementById("todo-list");
const count = document.getElementById("count");
const clearDoneBtn = document.getElementById("clear-done");
const filterBtns = document.querySelectorAll(".filter");

let todos = [];
let filter = "all";

// Veritabanından tüm görevleri çek
async function load() {
  const { data, error } = await db
    .from("todos")
    .select("*")
    .order("inserted_at", { ascending: true });

  if (error) {
    console.error("Görevler yüklenemedi:", error);
    list.innerHTML = '<li class="empty">⚠️ Veritabanına bağlanılamadı.</li>';
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

// Yeni görev ekle
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

// Tamamlandı durumunu değiştir
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

// Görev sil
async function remove(id) {
  const { error } = await db.from("todos").delete().eq("id", id);
  if (error) return console.error("Silinemedi:", error);
  todos = todos.filter((t) => t.id !== id);
  render();
}

// Tamamlananları topluca sil
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

// Başlat
load();
