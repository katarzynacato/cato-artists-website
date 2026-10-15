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

    if (slug === 'diana-lamar') {
      const section = document.getElementById('stage-photos');
      if (section) {
        section.querySelector('h2').textContent = data.stage_heading || 'Stage Photos';
        section.querySelector('.stage-intro').textContent = data.stage_description || '';
        const track = section.querySelector('.cato-carousel-track');
        const photos = Array.from({length: 8}, (_, i) => data['stage_photo_' + (i + 1)]).filter(Boolean);
        track.replaceChildren();
        for (const [i, url] of photos.entries()) {
          const figure = document.createElement('figure'); figure.className = 'stage-slide';
          const img = document.createElement('img'); img.src = url; img.loading = 'lazy'; img.alt = 'Diana Lamar — stage photo ' + (i + 1);
          figure.append(img); track.append(figure);
        }
        section.hidden = !photos.length;
        for (const [direction, selector] of [[-1,'.prev'],[1,'.next']]) {
          section.querySelector(selector).addEventListener('click', () => track.scrollBy({left: direction * track.clientWidth * .85, behavior: 'smooth'}));
        }
      }
      const videoSection = document.getElementById('stage-videos');
      if (videoSection) {
        videoSection.querySelector('h2').textContent = data.stage_video_heading || 'Additional Stage Videos';
        const grid = document.getElementById('diana-stage-videos');
        for (let i = 1; i <= 4; i++) {
          const url = data['stage_video_' + i]; if (!url) continue;
          let id = '';
          try { const u = new URL(url); if (u.hostname === 'youtu.be' || u.hostname === 'www.youtu.be') id = u.pathname.slice(1); else if (['youtube.com','www.youtube.com','m.youtube.com','www.youtube-nocookie.com'].includes(u.hostname)) id = u.searchParams.get('v') || u.pathname.match(/\/(?:embed|shorts)\/([^/]+)/)?.[1] || ''; } catch (_) {}
          if (!/^[a-zA-Z0-9_-]{11}$/.test(id)) continue;
          const item = document.createElement('div'); item.className = 'stage-video-item';
          const frame = document.createElement('iframe'); frame.src = 'https://www.youtube-nocookie.com/embed/' + id; frame.title = data['stage_video_title_' + i] || 'Diana Lamar stage video'; frame.loading = 'lazy'; frame.allowFullscreen = true; frame.allow = 'accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture';
          const caption = document.createElement('p'); caption.textContent = data['stage_video_title_' + i] || 'Stage performance';
          item.append(frame,caption); grid.append(item);
        }
        videoSection.hidden = !grid.children.length;
      }
    }
  } catch (err) {console.warn('CATO ARTISTS CMS:', err);}
})();
