# Which app you're using & why the cart wasn't opening

## Which app you're using

When you run:

- **`./run_Eira.sh`** from the repo root, or  
- **`cd nextjs_space && npm run dev`** from the repo root,

you are using the app in:

**`nextjs_space`** (the folder at the **root** of `eira-designs`).

You are **not** using the app in `eira-designs-main/nextjs_space`. That folder is a different copy of the app (different layout, different cart setup).

So: **you're using the root `nextjs_space`.**

---

## What was fixed so the cart can open

1. **Providers no longer return `null`**  
   The app was rendering nothing until after a client-side “mounted” check. That could prevent the cart context and drawer from being ready when you click. Providers now always render the full tree (Session, Theme, CartDrawerProvider, CartDrawer) so the cart is available as soon as the app loads.

2. **URL test: open cart by link**  
   If the cart icon/sidebar still don’t open the drawer, you can confirm the drawer works by opening it via the URL:

   - Go to: **http://localhost:3000/dashboard?cart=open**  
     (or **http://localhost:3000/creator?cart=open** after logging in)

   If the cart **panel opens** when you use that URL, then the drawer and context work and the problem is only with the **click** (button or sidebar). If the panel **does not** open with that URL, the issue is with the drawer/context.

3. **Cart opens into `document.body`**  
   The cart panel is rendered with a portal into `document.body` with high z-index so no layout or sidebar should cover it.

---

## What you should do

1. **Restart the dev server**  
   From repo root:
   ```bash
   ./run_Eira.sh
   ```
   Or:
   ```bash
   cd nextjs_space && npm run dev
   ```

2. **Hard refresh the browser**  
   Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows/Linux).

3. **Log in**  
   The cart icon in the header only shows when you’re logged in.

4. **Try opening the cart**
   - Click the **cart icon** (top right), or  
   - Click **Cart** in the **left sidebar**, or  
   - Visit **http://localhost:3000/dashboard?cart=open** (or `/creator?cart=open`).

5. **If it still doesn’t open**  
   Open DevTools (F12) → **Console**, then click the cart again. Note any **red errors** and share them so we can fix the exact cause.
