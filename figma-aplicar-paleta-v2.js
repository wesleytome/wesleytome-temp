// Paleta Wesley Tomé v2 (Carbono, Grafite, Papel, Pedra, Névoa, Fumo, Lima)
// Arquivo: North Consulting - LinkedIn Cover - North Star (VCr2QWwxyF2FvZ5qPgIyYi)
// Página: "Wesley Tomé - Ads". Roda no plugin Scripter (figma.com/community/plugin/757836922707087381)
// ou pelo Figma MCP (use_figma) quando o limite mensal liberar.
//
// O que faz:
// 1. Retargeta as 5 variáveis da coleção "Paleta Wesley Tomé" (v1 → v2) e cria Pedra e Fumo.
//    Como os fills das 4 variações estão vinculados às variáveis, a maior parte da troca é automática.
// 2. Ajusta os poucos vínculos que mudam de papel (fundo Pedra, corpo em Fumo, "andou." em Fumo no claro,
//    janela em Grafite no escuro) e as linhas em gradiente, que não são vinculadas.
// 3. Renomeia as 4 variações. Não mexe nos frames originais nem na coleção antiga "Paleta".

(async () => {
  const page = await figma.getNodeByIdAsync("245:4325");
  await figma.setCurrentPageAsync(page);

  const col = await figma.variables.getVariableCollectionByIdAsync("VariableCollectionId:296:2");
  const mode = col.modes[0].modeId;
  const RGB = { Carbono:[28,28,28], Grafite:[44,44,44], Papel:[244,244,241], Névoa:[197,197,197], Lima:[212,236,97], Pedra:[216,216,210], Fumo:[105,105,101] };
  const C = {}; for (const k in RGB) C[k] = { r:RGB[k][0]/255, g:RGB[k][1]/255, b:RGB[k][2]/255 };
  const V = {};
  const retarget = [["VariableID:296:3","Carbono"],["VariableID:296:4","Grafite"],["VariableID:296:5","Papel"],["VariableID:296:6","Névoa"],["VariableID:296:7","Lima"]];
  for (const [id,name] of retarget) { const v = await figma.variables.getVariableByIdAsync(id); v.name = name; v.setValueForMode(mode, {...C[name], a:1}); V[name] = v; }
  const existing = {}; for (const id of col.variableIds) { const v = await figma.variables.getVariableByIdAsync(id); existing[v.name] = v; }
  for (const name of ["Pedra","Fumo"]) {
    let v = existing[name];
    if (!v) { v = figma.variables.createVariable(name, col, "COLOR"); v.scopes = ["FRAME_FILL","SHAPE_FILL","TEXT_FILL","STROKE_COLOR"]; }
    v.setValueForMode(mode, {...C[name], a:1}); V[name] = v;
  }
  const solid = (key, opacity = 1) => {
    const p = { type:'SOLID', color:C[key], opacity };
    let b = p; try { b = figma.variables.setBoundVariableForPaint(p, 'color', V[key]); } catch (e) {}
    return Object.assign({}, b, { opacity }); // o binding descarta a opacidade; reatribuir
  };
  const regrad = (node, key) => {
    if (!Array.isArray(node.fills)) return;
    const fills = JSON.parse(JSON.stringify(node.fills)); const g = fills[0];
    if (!g || !g.gradientStops) return;
    g.gradientStops = g.gradientStops.map(s => ({ position:s.position, color:{ ...C[key], a:s.color.a } }));
    node.fills = fills;
  };

  // BEM AQUI OH · Carbono (296:8)
  const bemDark = await figma.getNodeByIdAsync("296:8");
  bemDark.name = "BEM AQUI OH · Carbono";
  for (const n of bemDark.children) {
    if (n.name === 'Terminal macOS') { n.fills = [solid('Grafite')]; n.strokes = [solid('Papel', 0.12)]; }
    if (n.name === 'Ground' || n.name === 'Divider') regrad(n, 'Névoa');
  }

  // BEM AQUI OH · Papel (296:73)
  const bemLight = await figma.getNodeByIdAsync("296:73");
  bemLight.name = "BEM AQUI OH · Papel";
  for (const n of bemLight.children) {
    if (n.name === 'Ground' || n.name === 'Divider') regrad(n, 'Carbono');
    if (n.name === 'Terminal macOS') n.effects = [{ type:'DROP_SHADOW', color:{ ...C.Carbono, a:0.18 }, offset:{ x:0, y:16 }, radius:40, spread:0, visible:true, blendMode:'NORMAL' }];
    if (n.name === 'Phrase' && n.type === 'TEXT') {
      const segs = n.getStyledTextSegments(['fills']);
      if (segs.length > 1) { const s = segs[segs.length - 1]; n.setRangeFills(s.start, s.end, [solid('Fumo')]); }
    }
  }

  // AQUI OH 2 · Grafite (296:138)
  const aqDark = await figma.getNodeByIdAsync("296:138");
  aqDark.name = "AQUI OH 2 · Grafite";
  for (const n of aqDark.children) if (n.name === 'Divider') regrad(n, 'Papel');

  // AQUI OH 2 · Pedra (296:144)
  const aqStone = await figma.getNodeByIdAsync("296:144");
  aqStone.name = "AQUI OH 2 · Pedra";
  aqStone.fills = [solid('Pedra')];
  for (const n of aqStone.children) {
    if (n.name === 'Divider') regrad(n, 'Carbono');
    else if (n.type === 'TEXT' && n.name !== '70%' && n.name !== 'Domain') {
      const fam = n.getStyledTextSegments(['fontName'])[0].fontName.family;
      if (fam !== 'Oxanium') n.fills = [solid('Fumo')];
    }
  }

  // Quadro de paleta (298:2): atualizar nomes, hex e papéis dos 5 swatches existentes
  const board = await figma.getNodeByIdAsync("298:2");
  if (board) {
    await figma.loadFontAsync({ family:'Oxanium', style:'SemiBold' });
    await figma.loadFontAsync({ family:'Manrope', style:'Regular' });
    await figma.loadFontAsync({ family:'Manrope', style:'Medium' });
    const rows = [
      ['Carbono','#1C1C1C','Base escura. O mesmo preto do site e da capa do LinkedIn.'],
      ['Grafite','#2C2C2C','Superfície. Janelas, cartões e um segundo fundo escuro.'],
      ['Papel','#F4F4F1','Luz. Branco quente de papel: texto sobre escuro e fundo claro.'],
      ['Névoa','#C5C5C5','Texto secundário sobre escuro. (Sobre claro: Fumo #696965.)'],
      ['Lima','#D4EC61','Acento único, herdado do logo. Nunca como texto sobre fundo claro.'],
    ];
    const swatchRows = board.findAll(n => n.type === 'FRAME' && n.name.startsWith('Swatch · '));
    swatchRows.forEach((row, i) => {
      if (!rows[i]) return;
      row.name = 'Swatch · ' + rows[i][0];
      const texts = row.findAll(n => n.type === 'TEXT');
      if (texts[0]) texts[0].characters = rows[i][0];
      if (texts[1]) texts[1].characters = rows[i][1];
      if (texts[2]) texts[2].characters = rows[i][2];
    });
    const sub = board.findOne(n => n.type === 'TEXT' && n.characters.startsWith('Uma base'));
    if (sub) sub.characters = 'Preto, papel e um risco de lima. O mesmo lima do logo, da capa e do site.';
  }

  figma.notify('Paleta Wesley Tomé v2 aplicada');
  figma.closePlugin();
})();
