const STORAGE_KEY = "atelier_boutique_pos_v1";
const money = value => new Intl.NumberFormat("en-KE", {style:"currency",currency:"KES"}).format(Number(value || 0));
const todayKey = () => new Date().toLocaleDateString("en-CA");
const seedProducts = [
  {id:"p1",name:"Classic leather handbag",category:"Handbags",sku:"HB001",price:3500,stock:8,reorder:2},
  {id:"p2",name:"Gold-tone hoop earrings",category:"Jewellery",sku:"JW014",price:850,stock:14,reorder:3},
  {id:"p3",name:"Everyday block heels",category:"Shoes",sku:"SH006",price:4200,stock:4,reorder:2},
  {id:"p4",name:"Floral eau de parfum",category:"Perfumes",sku:"PF003",price:2800,stock:2,reorder:2},
  {id:"p5",name:"Occasion fascinator",category:"Hats & Fascinators",sku:"HF009",price:1800,stock:1,reorder:2},
  {id:"p6",name:"Silk printed scarf",category:"Accessories",sku:"AC021",price:1200,stock:12,reorder:3}
];
let state = loadState();
let cart = [];
let lastReceipt = null;

function loadState(){
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if(saved && Array.isArray(saved.products) && Array.isArray(saved.sales)) return saved;
  } catch(e) {}
  return {products:seedProducts, sales:[]};
}
function saveState(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function escapeHtml(value){return String(value ?? "").replace(/[&<>"']/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function toast(message){const el=document.getElementById("toast");el.textContent=message;el.classList.add("show");setTimeout(()=>el.classList.remove("show"),2600);}
function showView(name){
  document.querySelectorAll(".view").forEach(v=>v.classList.toggle("active",v.id===`view-${name}`));
  document.querySelectorAll(".nav-link").forEach(b=>b.classList.toggle("active",b.dataset.view===name));
  const titles={dashboard:"Overview",pos:"New sale",inventory:"Inventory",history:"Sales history"};
  document.getElementById("page-title").textContent=titles[name];
  if(name==="pos") renderProductOptions();
  if(name==="inventory") renderInventory();
  if(name==="history") renderHistory();
  if(name==="dashboard") renderDashboard();
}
document.querySelectorAll(".nav-link").forEach(b=>b.addEventListener("click",()=>showView(b.dataset.view)));
document.querySelectorAll("[data-goto]").forEach(b=>b.addEventListener("click",()=>showView(b.dataset.goto)));
document.getElementById("quick-sale").addEventListener("click",()=>showView("pos"));
document.getElementById("date-label").textContent=new Date().toLocaleDateString("en-KE",{weekday:"long",day:"numeric",month:"long",year:"numeric"});

function renderDashboard(){
  const todays=state.sales.filter(s=>s.dateKey===todayKey());
  const revenue=todays.reduce((sum,s)=>sum+s.total,0);
  document.getElementById("stat-today").textContent=money(revenue);
  document.getElementById("stat-transactions").textContent=`${todays.length} transaction${todays.length===1?"":"s"} today`;
  document.getElementById("stat-products").textContent=state.products.length;
  document.getElementById("stat-units").textContent=state.products.reduce((sum,p)=>sum+p.stock,0);
  const low=state.products.filter(p=>p.stock<=p.reorder);
  document.getElementById("stat-low").textContent=low.length;
  const recent=[...state.sales].reverse().slice(0,5);
  document.getElementById("recent-sales").innerHTML=recent.length?table(["RECEIPT","CUSTOMER","DATE","TOTAL"],recent.map(s=>[
    `<strong>${escapeHtml(s.receiptNo)}</strong>`,escapeHtml(s.customer),new Date(s.createdAt).toLocaleDateString("en-KE"),money(s.total)
  ])):`<div class="empty-table">No sales yet. Start with a new sale.</div>`;
  document.getElementById("low-stock-list").innerHTML=low.length?low.slice(0,5).map(p=>`<div class="stock-row"><div><strong>${escapeHtml(p.name)}</strong><small>${escapeHtml(p.sku||p.category)}</small></div><span class="pill low">${p.stock} left</span></div>`).join(""):`<div class="empty-table">All products are above their reorder levels.</div>`;
}
function table(headers, rows){
  return `<table><thead><tr>${headers.map(h=>`<th>${h}</th>`).join("")}</tr></thead><tbody>${rows.map(r=>`<tr>${r.map(c=>`<td>${c}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
}
function renderProductOptions(){
  const select=document.getElementById("sale-product"), previous=select.value;
  select.innerHTML=`<option value="">Choose a product</option>`+state.products.filter(p=>p.stock>0).map(p=>`<option value="${p.id}">${escapeHtml(p.name)} — ${money(p.price)}</option>`).join("");
  if(state.products.some(p=>p.id===previous&&p.stock>0))select.value=previous;
  updateProductInfo();
}
document.getElementById("sale-product").addEventListener("change",updateProductInfo);
function updateProductInfo(){
  const p=state.products.find(x=>x.id===document.getElementById("sale-product").value);
  document.getElementById("product-info").textContent=p?`${p.category} · ${money(p.price)} each · ${p.stock} available`:"Select a product to see its price and available stock.";
}
document.getElementById("add-to-cart").addEventListener("click",()=>{
  const id=document.getElementById("sale-product").value;
  const qty=Number(document.getElementById("sale-quantity").value);
  const p=state.products.find(x=>x.id===id);
  if(!p)return toast("Choose a product first.");
  if(!Number.isInteger(qty)||qty<=0)return toast("Quantity must be a whole number greater than zero.");
  const already=cart.filter(x=>x.productId===id).reduce((s,x)=>s+x.quantity,0);
  if(qty+already>p.stock)return toast(`Only ${p.stock-already} more unit(s) available.`);
  const line=cart.find(x=>x.productId===id);
  if(line)line.quantity+=qty;else cart.push({productId:id,quantity:qty});
  document.getElementById("sale-quantity").value=1;
  renderCart();toast("Product added to sale.");
});
function cartSubtotal(){return cart.reduce((sum,line)=>{const p=state.products.find(x=>x.id===line.productId);return sum+(p?p.price*line.quantity:0)},0);}
function renderCart(){
  const lines=document.getElementById("cart-lines");
  document.getElementById("cart-count").textContent=`${cart.reduce((s,x)=>s+x.quantity,0)} units`;
  lines.innerHTML=cart.length?cart.map(line=>{const p=state.products.find(x=>x.id===line.productId);return `<div class="cart-line"><div><strong>${escapeHtml(p?.name||"Product")}</strong><small>${line.quantity} × ${money(p?.price)}</small></div><div><strong>${money((p?.price||0)*line.quantity)}</strong><button class="remove-line" data-remove="${line.productId}">Remove</button></div></div>`}).join(""):`<div class="empty-state">Your sale is empty.<br>Choose a product to begin.</div>`;
  lines.querySelectorAll("[data-remove]").forEach(b=>b.addEventListener("click",()=>{cart=cart.filter(x=>x.productId!==b.dataset.remove);renderCart();}));
  document.getElementById("cart-subtotal").textContent=money(cartSubtotal());
  document.getElementById("cart-discount").textContent="Calculated at checkout";
  document.getElementById("cart-total").textContent=money(cartSubtotal());
  document.getElementById("complete-sale").disabled=!cart.length;
}
document.getElementById("complete-sale").addEventListener("click",completeSale);

async function completeSale(){
  if(!cart.length)return;
  const payload={customer:document.getElementById("customer-name").value.trim()||"Walk-in customer",
    items:cart.map(line=>{const p=state.products.find(x=>x.id===line.productId);return {product_id:p.id,name:p.name,quantity:line.quantity,unit_price:p.price,available_stock:p.stock};})};
  const button=document.getElementById("complete-sale");button.disabled=true;button.textContent="Calculating…";
  try{
    const response=await fetch("/api/calculate_sale",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
    const result=await response.json();
    if(!response.ok)throw new Error(result.error||"Sale could not be completed.");
    result.items.forEach(item=>{const p=state.products.find(x=>x.id===item.product_id);p.stock-=item.quantity;});
    const sale={...result,receiptNo:`AT-${Date.now().toString().slice(-8)}`,createdAt:new Date().toISOString(),dateKey:todayKey()};
    state.sales.push(sale);saveState();lastReceipt=sale;cart=[];
    document.getElementById("customer-name").value="";
    renderCart();renderProductOptions();renderDashboard();renderInventory();showReceipt(sale);
  }catch(error){toast(error.message);}
  finally{button.disabled=!cart.length;button.textContent="Complete sale";}
}
function showReceipt(sale){
  document.getElementById("receipt-content").innerHTML=`<div class="receipt"><h2>ATELIER</h2><div class="sub">BOUTIQUE STUDIO · CUSTOMER RECEIPT</div><div class="rline"><span>Receipt</span><strong>${escapeHtml(sale.receiptNo)}</strong></div><div class="rline"><span>Date</span><span>${new Date(sale.createdAt).toLocaleString("en-KE")}</span></div><div class="rline"><span>Customer</span><span>${escapeHtml(sale.customer)}</span></div>${sale.items.map(i=>`<div class="rline"><span>${escapeHtml(i.name)} × ${i.quantity}</span><strong>${money(i.line_total)}</strong></div>`).join("")}<div class="rline"><span>Subtotal</span><span>${money(sale.subtotal)}</span></div><div class="rline"><span>Discount (${sale.discount_rate*100}%)</span><span>− ${money(sale.discount_amount)}</span></div><div class="rline total"><span>AMOUNT PAID</span><strong>${money(sale.total)}</strong></div><div class="thanks">Thank you for shopping with us.</div></div>`;
  document.getElementById("receipt-modal").classList.remove("hidden");
}
document.getElementById("close-receipt").addEventListener("click",()=>document.getElementById("receipt-modal").classList.add("hidden"));
document.getElementById("print-receipt").addEventListener("click",()=>window.print());

function renderInventory(){
  const query=document.getElementById("inventory-search").value.toLowerCase();
  const products=state.products.filter(p=>(p.name+" "+p.category+" "+p.sku).toLowerCase().includes(query));
  document.getElementById("inventory-count").textContent=state.products.length;
  document.getElementById("inventory-table").innerHTML=products.length?table(["PRODUCT","SKU","CATEGORY","UNIT PRICE","IN STOCK","STATUS"],products.map(p=>[
    `<div class="product-cell"><strong>${escapeHtml(p.name)}</strong></div>`,escapeHtml(p.sku||"—"),escapeHtml(p.category),money(p.price),p.stock,`<span class="pill ${p.stock<=p.reorder?"low":"ok"}">${p.stock<=p.reorder?"Reorder":"In stock"}</span>`
  ])):`<div class="empty-table">No matching products found.</div>`;
}
document.getElementById("inventory-search").addEventListener("input",renderInventory);
function toggleProductForm(show){document.getElementById("add-product-panel").classList.toggle("hidden",!show);}
document.getElementById("show-add-product").addEventListener("click",()=>toggleProductForm(true));
document.getElementById("hide-add-product").addEventListener("click",()=>toggleProductForm(false));
document.getElementById("cancel-product").addEventListener("click",()=>toggleProductForm(false));
document.getElementById("product-form").addEventListener("submit",e=>{
  e.preventDefault();
  const name=document.getElementById("new-name").value.trim(),sku=document.getElementById("new-sku").value.trim();
  const price=Number(document.getElementById("new-price").value),stock=Number(document.getElementById("new-stock").value),reorder=Number(document.getElementById("new-reorder").value);
  if(!name||!Number.isFinite(price)||price<=0||!Number.isInteger(stock)||stock<0||!Number.isInteger(reorder)||reorder<0)return toast("Please check the product details.");
  if(sku&&state.products.some(p=>p.sku.toLowerCase()===sku.toLowerCase()))return toast("That SKU already exists.");
  state.products.push({id:"p"+Date.now(),name,category:document.getElementById("new-category").value,sku,price,stock,reorder});
  saveState();e.target.reset();document.getElementById("new-reorder").value=1;toggleProductForm(false);renderInventory();renderDashboard();renderProductOptions();toast("Product saved.");
});
function renderHistory(){
  const sales=[...state.sales].reverse();
  document.getElementById("history-table").innerHTML=sales.length?table(["RECEIPT","DATE","CUSTOMER","ITEMS","SUBTOTAL","DISCOUNT","TOTAL"],sales.map(s=>[
    `<strong>${escapeHtml(s.receiptNo)}</strong>`,new Date(s.createdAt).toLocaleString("en-KE"),escapeHtml(s.customer),s.items.reduce((n,i)=>n+i.quantity,0),money(s.subtotal),money(s.discount_amount),`<strong>${money(s.total)}</strong>`
  ])):`<div class="empty-table">No completed sales yet.</div>`;
}
document.getElementById("export-sales").addEventListener("click",()=>{
  const rows=[["Receipt","Date","Customer","Subtotal","Discount","Total","Items"]];
  state.sales.forEach(s=>rows.push([s.receiptNo,s.createdAt,s.customer,s.subtotal,s.discount_amount,s.total,s.items.map(i=>`${i.name} x${i.quantity}`).join("; ")]));
  const csv=rows.map(row=>row.map(v=>`"${String(v??"").replace(/"/g,'""')}"`).join(",")).join("\n");
  const url=URL.createObjectURL(new Blob([csv],{type:"text/csv"}));const a=document.createElement("a");a.href=url;a.download="atelier-sales.csv";a.click();URL.revokeObjectURL(url);
});
renderDashboard();renderInventory();renderCart();
