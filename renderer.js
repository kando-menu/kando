
document.querySelector('#close-button').addEventListener('click', () => {
  window.api.hideWindow();
});

document.querySelector('#dev-tools-button').addEventListener('click', () => {
  window.api.showDevTools();
});

document.addEventListener('keyup', ev => {
  if (ev.key === 'Escape') {
    window.api.hideWindow();
  }
});

let thing = document.querySelector('#thing');

thing.addEventListener('click', () => {
  window.api.itemSelected();
});

window.api.showMenu((a, pos) => {
  document.querySelector('body').classList.add('visible');
  thing.style.transform = `translate(${pos.x}px, ${pos.y}px)`;
});