export function generarColorDeterminista(id) {
    const coloresBase = [...];
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      const char = id.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    const colorIndex = Math.abs(hash) % coloresBase.length;
    return coloresBase[colorIndex];
  }