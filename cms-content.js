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
