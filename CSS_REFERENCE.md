# Design System CSS Variables & Components

## 🎨 Complete CSS Variables

All CSS variables are defined in `resources/css/diamond-gallery.css`:

```css
:root {
  --gold: #B8953F;
  --gold-light: #D4AF5A;
  --gold-pale: #F5EDD8;
  --gold-dark: #7A6029;
  
  --ink: #1C1C1C;
  --ink-mid: #4A4A4A;
  --ink-soft: #8A8A8A;
  
  --surface: #FDFAF5;
  --surface-2: #F5F0E8;
  --surface-3: #EDE5D4;
  
  --white: #FFFFFF;
  --border: #E2D9C8;
  --border-strong: #C8B99A;
  
  --green: #2D6A4F;
  --green-bg: #E8F4EE;
  --amber: #92600A;
  --amber-bg: #FEF3E2;
  --red: #8B2020;
  --red-bg: #FDEAEA;
  --purple: #4A3A9A;
  --purple-bg: #F0EDFB;
}
```

## 🏗️ Layout Components

### Topbar
```css
.topbar {
  background-color: var(--white);
  border-bottom: 1px solid var(--border);
  padding: 0 22px;
  height: 54px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.topbar-title {
  font-family: 'Cormorant Garamond', serif;
  font-size: 21px;
  font-weight: 500;
}
```

### Content Area
```css
.content-scroll {
  flex: 1;
  overflow-y: auto;
  padding: 18px 22px;
}
```

### Detail Panel
```css
.detail-panel {
  width: 400px;
  flex-shrink: 0;
  background-color: var(--white);
  border-left: 1px solid var(--border);
  overflow-y: auto;
  box-shadow: -4px 0 12px rgba(0, 0, 0, 0.08);
}

.panel-inner {
  padding: 18px;
  min-width: 400px;
}
```

## 🔘 Button Components

### Standard Button
```css
.btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 7px 13px;
  border-radius: 6px;
  border: 1px solid var(--border);
  background-color: var(--white);
  color: var(--ink-mid);
  font-family: 'DM Sans', sans-serif;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
}

.btn:hover {
  border-color: var(--border-strong);
  background-color: var(--surface-2);
  color: var(--ink);
}
```

### Gold Button
```css
.btn-gold {
  background-color: var(--gold);
  color: var(--white);
  border-color: var(--gold);
}

.btn-gold:hover {
  background-color: var(--gold-dark);
  border-color: var(--gold-dark);
  color: var(--white);
}
```

## 📊 Statistics & Cards

### Stat Card
```css
.stat-card {
  background-color: var(--white);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 13px 15px;
}

.stat-label {
  font-size: 10px;
  color: var(--ink-soft);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: 5px;
}

.stat-value {
  font-family: 'Cormorant Garamond', serif;
  font-size: 26px;
  font-weight: 500;
  line-height: 1;
}

.stat-value.gold { color: var(--gold-dark); }
.stat-value.warn { color: var(--amber); }
.stat-value.danger { color: var(--red); }
```

## 🏷️ Badges & Status

### Badge
```css
.badge {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 3px 9px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 500;
}

.badge-ring { background-color: var(--purple-bg); color: var(--purple); }
.badge-jewellery { background-color: var(--green-bg); color: var(--green); }
.badge-paid { background-color: var(--green-bg); color: var(--green); }
.badge-deposit { background-color: var(--amber-bg); color: var(--amber); }
.badge-unpaid { background-color: var(--red-bg); color: var(--red); }
```

### Task Steps
```css
.step-done { 
  background-color: var(--green-bg); 
  color: var(--green); 
  border-color: #A8D5B5; 
  font-weight: 600; 
}
.step-active { 
  background-color: var(--amber-bg); 
  color: var(--amber); 
  border-color: #F0C070); 
}
.step-todo { 
  background-color: var(--surface-2); 
  color: var(--ink-soft); 
  border-color: var(--border); 
}
```

## 💼 Job Cards

```css
.job-card {
  background-color: var(--white);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 13px 15px;
  cursor: pointer;
  transition: all 0.15s;
  margin-bottom: 7px;
}

.job-card:hover {
  border-color: var(--gold);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.job-card.selected {
  border-color: var(--gold);
  border-width: 1.5px;
}

.job-id {
  font-family: 'Cormorant Garamond', serif;
  font-size: 15px;
  font-weight: 500;
  color: var(--gold-dark);
}

.job-product {
  font-size: 13px;
  font-weight: 500;
  line-height: 1.3;
}

.job-client {
  font-size: 12px;
  color: var(--ink-soft);
  margin-top: 2px;
}
```

## 🎯 Due Date Indicators

```css
.due-ok { color: var(--ink-soft); }
.due-soon { color: var(--amber); }
.due-overdue { color: var(--red); }
```

## 💰 Payment Grid

```css
.money-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 7px;
}

.money-cell {
  background-color: var(--surface-2);
  border-radius: 8px;
  padding: 9px;
  text-align: center;
}

.money-lbl {
  font-size: 10px;
  color: var(--ink-soft);
  text-transform: uppercase;
  letter-spacing: 0.07em;
  margin-bottom: 3px;
}

.money-val {
  font-family: 'Cormorant Garamond', serif;
  font-size: 18px;
  font-weight: 500;
}

.money-val.owed { color: var(--red); }
.money-val.paid-color { color: var(--green); }
```

## 📱 Mobile Responsive

```css
@media (max-width: 680px) {
  .detail-panel {
    width: 100%;
    position: fixed;
    inset: 0;
    bottom: 52px;
    z-index: 50;
    border: none;
    border-radius: 16px 16px 0 0;
  }
  
  .topbar {
    padding: 0 14px;
    height: 50px;
  }
  
  .topbar-title {
    font-size: 18px;
  }
  
  .content-scroll {
    padding: 12px 14px;
  }
}
```

## 📝 Typography Stack

### Fonts Imported
```css
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500;600&family=DM+Sans:wght@300;400;500&display=swap');
```

### Font Application
```css
/* Default body */
html, body {
  font-family: 'DM Sans', sans-serif;
  font-size: 14px;
  line-height: 1.5;
}

/* Headings */
h1, h2, h3, h4, h5, h6 {
  font-family: 'Cormorant Garamond', serif;
}
```

## ✨ Usage Example

```tsx
// In a React component
<div className="topbar">
  <h1 className="topbar-title">Orders Management</h1>
  <button className="btn btn-gold">+ New Order</button>
</div>

<div className="content-scroll">
  <div className="stat-card">
    <p className="stat-label">Total Value</p>
    <p className="stat-value gold">$61,790</p>
  </div>
  
  <div className="job-card">
    <div className="job-id">DG-001</div>
    <div className="job-product">Custom Ring</div>
    <div className="job-client">Madeleine Perrottet</div>
  </div>
</div>

{selectedJob && (
  <div className="detail-panel">
    <div className="panel-inner">
      {/* Job details */}
    </div>
  </div>
)}
```

All colors, spacing, and typography are now centralized and consistent! 🎨
