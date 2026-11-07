# Wedding invitation

A static site in plain HTML, CSS and JavaScript, with no build step.

| File | Purpose |
|---|---|
| `config.js` | All names, dates, venue, music, gallery and the RSVP URL |
| `index.html` | Page structure and fixed wording |
| `css/style.css` | Styling. Colours and fonts are at the top |
| `js/app.js` | Page behaviour |
| `google-apps-script/Code.gs` | Guest list lookups, RSVPs and wishes, plus the sheet's Undangan menu |

## Run locally

From this folder:

```bash
python -m http.server 8090
```

Open `http://localhost:8090/?to=Nama%20Tamu`.

## Connect the Google Sheet

Until `rsvpUrl` is set, the form runs in demo mode and saves nothing.

1. Open the sheet and choose **Extensions > Apps Script**.
2. Replace the contents of `Code.gs` with `google-apps-script/Code.gs` from this folder, then save.
3. Choose **Deploy > New deployment**, select the type **Web app**, and set:
   - **Execute as:** Me
   - **Who has access:** Anyone
4. Click **Deploy** and approve the permission prompt for your own account.
5. Copy the **Web app URL**, which ends in `/exec`, into `rsvpUrl` in `config.js`.
6. In the sheet's **Share** dialog, set General access to **Restricted**. The page keeps working because the script runs under your account.

After changing `Code.gs`, publish it with **Deploy > Manage deployments > Edit > New version**. This keeps the same URL.

Responses land in a tab named `RSVP`. Untick **Tampilkan** on a row to hide that wish from the page; the change appears within about a minute.

## Guest list and links

The `Invitation` tab holds the guest list. Row 1 needs the headers `Nama` and `Session`. Session is `1` (11.00 - 12.00) or `2` (12.00 - 13.00), matching the order in `resepsi.sesi` in `config.js`.

In the sheet, choose **Undangan > Buat kode & link tamu**. It adds `Kode` and `Link` columns and gives each named guest a unique code. Run it again after adding guests: existing codes never change, so links you already sent keep working. Use **Undangan > Ubah alamat situs** once the site is published to fill in the links.

A guest link looks like `https://your-site.example/?k=H7K2QM`. The page then shows that guest's name, only their session, a countdown to their session, and a calendar event for it. Their RSVP row records the session.

Other links still work:

| Link | Shows |
|---|---|
| `?k=CODE` | Name and session from the guest list |
| `?to=Bapak%20Ahmad` | That name, with both sessions |
| `?to=Name&k=CODE` | The typed name, with the session from the guest list |
| No parameters, or an unknown code | "Tamu Undangan", with both sessions |

To move a guest to another session, change their `Session` value. Their existing link picks it up. Deleting a row disables that guest's link, and they see both sessions instead.

## Before going live

- Connect the Google Sheet. The demo wishes disappear once `rsvpUrl` is set.
- Replace the gallery crops with original photos. The current ones come from the print PDF, so they are low resolution.
- Upload the contents of this folder to any static host. It needs HTTPS for the music and RSVP to work reliably.
