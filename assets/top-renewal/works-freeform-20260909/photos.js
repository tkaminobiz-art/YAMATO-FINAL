// Preserve each category link if its photograph is unavailable.
document.querySelectorAll('#works.wf26 .wf26__photo').forEach(link => {
  const image = link.querySelector('img');
  const fallback = link.querySelector('.wf26__fallback');
  const setFailed = failed => {
    link.classList.toggle('is-error', failed);
    fallback.hidden = !failed;
  };
  image.addEventListener('error', () => setFailed(true));
  image.addEventListener('load', () => setFailed(false));
  if (image.complete && !image.naturalWidth) setFailed(true);
});
