document.addEventListener('keydown', e => {

  // If esc, clear selected
  if (e.keyCode === 27) {
    const boxMat = generateBoxMaterial(scene)
    state.selected.map(selected => {
      selected.material = boxMat
    })
    state.selected = []
  }
})
