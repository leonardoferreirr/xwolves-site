// Enxuga o GLB do Tripo (65 MB, 1,9 mi de triângulos, 3 texturas 4K) para o site.
//   node otimiza.mjs <entrada.glb> [triângulos=120000] [textura=2048]
// O lobo é desenhado sem luz, então só a textura de cor importa: normal e ORM saem, as normais dos vértices também.
// Saída: assets/lobo/lobo-1.glb (malha simplificada, quantizada e comprimida com meshopt, textura webp).
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS, EXTMeshoptCompression, KHRMaterialsUnlit } from '@gltf-transform/extensions';
import { weld, simplify, prune, dedup, quantize, reorder, textureCompress } from '@gltf-transform/functions';
import { MeshoptSimplifier, MeshoptEncoder } from 'meshoptimizer';
import sharp from 'sharp';
import { mkdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const [entrada, alvoTri = '120000', tex = '2048'] = process.argv.slice(2);
const saida = fileURLToPath(new URL('../../assets/lobo/lobo-1.glb', import.meta.url));
mkdirSync(fileURLToPath(new URL('../../assets/lobo/', import.meta.url)), { recursive: true });

await MeshoptEncoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.encoder': MeshoptEncoder });
const doc = await io.read(entrada);
const raiz = doc.getRoot();

const tris = () => raiz.listMeshes().reduce((n, m) => n + m.listPrimitives().reduce((k, p) => k + p.getIndices().getCount() / 3, 0), 0);
console.log('antes:', tris(), 'triângulos');

const unlit = doc.createExtension(KHRMaterialsUnlit);
for (const m of raiz.listMaterials()) {
  m.setNormalTexture(null).setMetallicRoughnessTexture(null).setOcclusionTexture(null).setEmissiveTexture(null);
  m.setExtension('KHR_materials_unlit', unlit.createUnlit());
}
for (const mesh of raiz.listMeshes()) for (const p of mesh.listPrimitives()) {
  for (const s of ['NORMAL', 'TANGENT']) { const a = p.getAttribute(s); if (a) { p.setAttribute(s, null); a.dispose(); } }
}

const total = tris();
await doc.transform(
  prune(),
  weld(),
  simplify({ simplifier: MeshoptSimplifier, ratio: Math.min(1, +alvoTri / total), error: 0.002, lockBorder: false }),
  textureCompress({ encoder: sharp, targetFormat: 'webp', resize: [+tex, +tex], quality: 86 }),
  dedup(),
  prune(),
  reorder({ encoder: MeshoptEncoder }),
  quantize({ quantizePosition: 14, quantizeTexcoord: 14 }),
);
doc.createExtension(EXTMeshoptCompression).setRequired(true).setEncoderOptions({ method: EXTMeshoptCompression.EncoderMethod.FILTER });
await io.write(saida, doc);
console.log('depois:', tris(), 'triângulos ·', (statSync(saida).size / 1024 / 1024).toFixed(2), 'MB →', saida);
