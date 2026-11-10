// In-page player for the explainer videos. The files are hosted on the
// platform itself (./media/videos/), so viewers never leave the page.
export function initVideos() {
  const modal = document.getElementById('video-modal') as HTMLDialogElement | null;
  const frame = document.getElementById('video-frame');
  if (!modal || !frame || typeof modal.showModal !== 'function') return;
  let opener: HTMLElement | null = null;

  const stop = () => {
    frame.querySelector('video')?.pause();
    frame.replaceChildren();
  };
  const close = () => {
    stop();
    if (modal.open) modal.close();
  };
  modal.addEventListener('close', () => {
    stop();
    opener?.focus();
  });
  modal.addEventListener('click', (e) => {
    if (e.target === modal) close(); // click on the backdrop
  });
  document.getElementById('video-close')?.addEventListener('click', close);

  document.querySelectorAll<HTMLButtonElement>('.video-btn[data-video]').forEach((btn) =>
    btn.addEventListener('click', () => {
      const name = btn.dataset.video!;
      opener = btn;
      const video = document.createElement('video');
      video.src = `./media/videos/${name}.mp4`;
      video.poster = `./media/videos/${name}-poster.webp`;
      video.controls = true;
      video.autoplay = true;
      video.playsInline = true;
      video.preload = 'auto';
      video.setAttribute('controlsList', 'nodownload');
      video.title = btn.textContent?.trim() || 'فيديو الشرح';
      frame.classList.toggle('is-short', btn.hasAttribute('data-short'));
      frame.replaceChildren(video);
      modal.showModal();
      video.play().catch(() => {}); // autoplay may need a tap on some phones
    }),
  );
}
