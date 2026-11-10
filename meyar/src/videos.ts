// In-page YouTube player: the explainer videos open in a dialog on the
// platform itself (privacy-enhanced youtube-nocookie embed), never on YouTube.
export function initVideos() {
  const modal = document.getElementById('video-modal') as HTMLDialogElement | null;
  const frame = document.getElementById('video-frame');
  if (!modal || !frame || typeof modal.showModal !== 'function') return;
  let opener: HTMLElement | null = null;

  const close = () => {
    frame.replaceChildren(); // stops playback
    if (modal.open) modal.close();
  };
  modal.addEventListener('close', () => {
    frame.replaceChildren();
    opener?.focus();
  });
  modal.addEventListener('click', (e) => {
    if (e.target === modal) close(); // click on the backdrop
  });
  document.getElementById('video-close')?.addEventListener('click', close);

  document.querySelectorAll<HTMLButtonElement>('.video-btn[data-yt]').forEach((btn) =>
    btn.addEventListener('click', () => {
      const id = btn.dataset.yt!;
      opener = btn;
      const iframe = document.createElement('iframe');
      iframe.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?autoplay=1&rel=0&playsinline=1&modestbranding=1`;
      iframe.title = btn.textContent?.trim() || 'فيديو الشرح';
      iframe.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
      iframe.allowFullscreen = true;
      // the page sends no referrer; YouTube's player needs the origin to play embeds
      iframe.referrerPolicy = 'strict-origin-when-cross-origin';
      frame.classList.toggle('is-short', btn.hasAttribute('data-short'));
      frame.replaceChildren(iframe);
      modal.showModal();
    }),
  );
}
