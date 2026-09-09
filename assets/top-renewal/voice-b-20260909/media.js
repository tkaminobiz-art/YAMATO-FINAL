// Category and enquiry links remain usable while a construction photograph is unavailable.
document.querySelectorAll('#voice.vb26 .vb26__scene, #visit.va26 .va26__scene').forEach(scene => {
  const image = scene.querySelector('img');
  const fallback = scene.querySelector('.av26__fallback');
  const setFailed = failed => {
    scene.classList.toggle('is-error', failed);
    fallback.hidden = !failed;
  };
  image.addEventListener('error', () => setFailed(true));
  image.addEventListener('load', () => setFailed(false));
  if (image.complete && !image.naturalWidth) setFailed(true);
});
