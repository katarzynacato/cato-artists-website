(async function () {
  try {
    const file = location.pathname.split('/').pop() || 'index.html';
    const slug = file.replace(/\.html$/, '');
    const response = await fetch('/content/' + slug + '.json', {cache:'no-store'});
    if (!response.ok) return;
    const data = await response.json();
    for (const [key, value] of Object.entries(data)) {
      if (typeof value !== 'string') continue;
      for (const el of document.querySelectorAll('[data-cms-text="' + key + '"]')) el.textContent = value;
      for (const el of document.querySelectorAll('[data-cms-image="' + key + '"]')) {if (value) el.setAttribute('src', value);}
      for (const el of document.querySelectorAll('[data-cms-href="' + key + '"]')) {if (value) el.setAttribute('href', value);}
      for (const el of document.querySelectorAll('[data-cms-url="' + key + '"]')) {if (value) el.setAttribute('src', value);}
    }

    // Keep embedded players in sync with editable YouTube links.
    for (const frame of document.querySelectorAll('[data-cms-video-link]')) {
      const url = data[frame.dataset.cmsVideoLink];
      if (!url) continue;
      try {
        const u = new URL(url);
        let id = '';
        if (['youtu.be','www.youtu.be'].includes(u.hostname)) id = u.pathname.slice(1);
        else if (['youtube.com','www.youtube.com','m.youtube.com','www.youtube-nocookie.com'].includes(u.hostname))
          id = u.searchParams.get('v') || (u.pathname.match(/\/(?:embed|shorts)\/([^/]+)/) || [])[1] || '';
        if (/^[a-zA-Z0-9_-]{11}$/.test(id)) frame.src = 'https://www.youtube-nocookie.com/embed/' + id;
      } catch (_) {}
    }


    // Artist links: editable repeatable list in Pages CMS.
    const artistLinksBox = document.getElementById('cms-artist-links');
    if (artistLinksBox) {
      const artistLinks = Array.isArray(data.artist_links) ? data.artist_links : [];
      const linksSection = artistLinksBox.closest('section');
      for (const entry of artistLinks) {
        const label = String(entry.label || '').trim();
        const rawUrl = String(entry.url || '').trim();
        if (!label || !rawUrl) continue;
        try {
          const parsed = new URL(rawUrl);
          if (!['https:', 'http:'].includes(parsed.protocol)) continue;
          const a = document.createElement('a');
          a.href = parsed.href; a.target = '_blank'; a.rel = 'noopener noreferrer';
          a.textContent = label + ' ↗';
          artistLinksBox.append(a);
        } catch (_) {}
      }
      if (linksSection) linksSection.hidden = !artistLinksBox.children.length;
    }

    // Repeatable calendar entries and press reviews. These arrays are edited in Pages CMS.
    const calendarData = Array.isArray(data.calendar_events) ? data.calendar_events : [];
    const calendarBox = document.getElementById('cms-calendar-list');
    if (calendarBox && calendarData.length) {
      const oldTable = calendarBox.parentElement.querySelector('table.calendar');
      if (oldTable) oldTable.hidden = true;
      const oldNote = calendarBox.parentElement.querySelector('.muted[data-cms-text]');
      if (oldNote) oldNote.hidden = true;
      const table = document.createElement('table'); table.className = 'calendar';
      table.innerHTML = '<thead><tr><th>Data / okres</th><th>Spektakl · rola</th><th>Teatr</th></tr></thead>';
      const tbody = document.createElement('tbody');
      for (const ev of calendarData) {
        const tr = document.createElement('tr');
        const date = document.createElement('td'); date.textContent = ev.date || '';
        const production = document.createElement('td');
        const title = document.createElement(ev.url ? 'a' : 'span');
        title.textContent = [ev.production, ev.role].filter(Boolean).join(' · ');
        if (ev.url) { title.href = ev.url; title.target = '_blank'; title.rel = 'noopener noreferrer'; }
        production.append(title);
        if (ev.composer) { const small = document.createElement('div'); small.className = 'muted'; small.textContent = ev.composer; production.append(small); }
        const theatre = document.createElement('td'); theatre.textContent = ev.theatre || '';
        tr.append(date, production, theatre); tbody.append(tr);
      }
      table.append(tbody); calendarBox.replaceChildren(table);
    }
    const reviewData = Array.isArray(data.press_reviews) ? data.press_reviews : [];
    const reviewBox = document.getElementById('cms-reviews-list');
    if (reviewBox && reviewData.length) {
      const section = reviewBox.closest('section');
      for (const node of section.querySelectorAll('blockquote, details')) node.hidden = true;
      for (const review of reviewData) {
        const quote = document.createElement('blockquote');
        quote.style.cssText = 'margin:0 0 24px;padding:18px 22px;border-left:2px solid #b79a5b;background:rgba(183,154,91,.06)';
        const p = document.createElement('p'); p.style.cssText = 'line-height:1.75;font-style:italic'; p.textContent = review.quote || '';
        quote.append(p);
        const label = [review.author, review.publication].filter(Boolean).join(' · ');
        if (label) {
          const a = document.createElement(review.url ? 'a' : 'span'); a.textContent = label;
          a.style.cssText = 'color:#c8a76a;font-size:12px;letter-spacing:.12em';
          if (review.url) { a.href = review.url; a.target = '_blank'; a.rel = 'noopener noreferrer'; }
          quote.append(a);
        }
        reviewBox.append(quote);
      }
    }

    // Repeatable media fields from Pages CMS: every artist gets the same gallery.
    const gallery = document.getElementById('artist-gallery');
    if (gallery) {
      const photos = Array.isArray(data.gallery_photos) ? data.gallery_photos.filter(x => typeof x === 'string' && x.trim()) : [];
      const videos = Array.isArray(data.gallery_videos) ? data.gallery_videos.filter(x => x && x.url) : [];
      const track = gallery.querySelector('.cato-carousel-track');
      for (const [i, src] of photos.entries()) {
        const figure = document.createElement('figure'); figure.className = 'stage-slide';
        const img = document.createElement('img'); img.src = src; img.alt = 'Stage photo ' + (i + 1); img.loading = 'lazy';
        figure.append(img); track.append(figure);
      }
      const videoGrid = gallery.querySelector('.gallery-video-grid');
      function youtubeId(value) {
        try {
          const u = new URL(value);
          let id = '';
          if (['youtu.be','www.youtu.be'].includes(u.hostname)) id = u.pathname.slice(1).split('/')[0];
          else if (['youtube.com','www.youtube.com','m.youtube.com','youtube-nocookie.com','www.youtube-nocookie.com'].includes(u.hostname))
            id = u.searchParams.get('v') || (u.pathname.match(/\/(?:embed|shorts|live)\/([^/]+)/) || [])[1] || '';
          return /^[A-Za-z0-9_-]{11}$/.test(id) ? id : '';
        } catch (_) { return ''; }
      }
      for (const video of videos) {
        const id = youtubeId(video.url); if (!id) continue;
        const item = document.createElement('div'); item.className = 'gallery-video-item';
        const iframe = document.createElement('iframe'); iframe.src = 'https://www.youtube-nocookie.com/embed/' + id;
        iframe.title = video.title || 'Opera performance'; iframe.loading = 'lazy'; iframe.allowFullscreen = true;
        iframe.allow = 'accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture';
        const title = document.createElement('p'); title.textContent = video.title || 'Stage performance';
        const link = document.createElement('a'); link.href = 'https://www.youtube.com/watch?v=' + id;
        link.target = '_blank'; link.rel = 'noopener noreferrer'; link.textContent = 'Watch on YouTube ↗';
        item.append(iframe,title,link); videoGrid.append(item);
      }
      gallery.hidden = !(photos.length || videoGrid.children.length);
      gallery.querySelector('.cato-carousel').hidden = !photos.length;
      gallery.querySelector('.prev').addEventListener('click', () => track.scrollBy({left:-track.clientWidth * .8,behavior:'smooth'}));
      gallery.querySelector('.next').addEventListener('click', () => track.scrollBy({left:track.clientWidth * .8,behavior:'smooth'}));
    }
  } catch (err) {console.warn('CATO ARTISTS CMS:', err);}
})();
