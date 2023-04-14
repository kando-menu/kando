
document.querySelector('#close-button').addEventListener('click', () => {
  window.api.hideWindow();
});

document.addEventListener('mousemove', ev => {
  let thing = document.querySelector('#thing');
  thing.style.transform = `translate(${ev.x - 50}px, ${ev.y - 50}px)`;
});

document.addEventListener('keyup', ev => {
  if (ev.key === 'Escape') {
    window.api.hideWindow();
  }
});
