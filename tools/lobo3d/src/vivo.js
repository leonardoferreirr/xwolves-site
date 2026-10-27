// O lobo 3D do topo, desenhado ao vivo (vira assets/js/lobo3d.js com `npm run pacote`).
// Só o pescoço gira: o terno fica parado. Sem luz, com a textura do jeito que veio, que já traz a luz da imagem
// original, e com o matiz puxado do lilás da textura para o azul-royal do lobo.
// O site.js chama lobo(canvas, url) e depois pose(giro, inclinação) a cada quadro; o poster.html usa o mesmo módulo
// para gerar a imagem de frente (frente.webp), então a troca da imagem pelo canvas não tem salto.
import { WebGLRenderer, Scene, PerspectiveCamera, SRGBColorSpace, NoToneMapping, Box3, Vector3, MathUtils } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';

const PESCOCO = { baixo: -0.3, alto: -0.05, pivo: new Vector3(0, -0.2, 0) }; // em unidades do modelo normalizado (altura 2)

const VERT = /* glsl */`
uniform float uGiro, uIncl, uBaixo, uAlto; uniform vec3 uPivo;
mat3 torce(vec3 p) {
  float w = smoothstep(uBaixo, uAlto, p.y), a = uGiro * w, b = uIncl * w;
  return mat3(cos(a),0.,-sin(a), 0.,1.,0., sin(a),0.,cos(a)) * mat3(1.,0.,0., 0.,cos(b),sin(b), 0.,-sin(b),cos(b));
}
`;
const FRAG = /* glsl */`
vec3 hsv(vec3 c) {
  vec4 K = vec4(0., -1./3., 2./3., -1.);
  vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
  vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
  float d = q.x - min(q.w, q.y);
  return vec3(abs(q.z + (q.w - q.y) / (6. * d + 1e-10)), d / (q.x + 1e-10), q.x);
}
vec3 rgb(vec3 c) { vec3 p = abs(fract(c.xxx + vec3(1., 2./3., 1./3.)) * 6. - 3.); return c.z * mix(vec3(1.), clamp(p - 1., 0., 1.), c.y); }
vec3 paraSrgb(vec3 c) { return mix(c * 12.92, 1.055 * pow(c, vec3(1. / 2.4)) - .055, step(.0031308, c)); }
vec3 paraLinear(vec3 c) { return mix(c / 12.92, pow((c + .055) / 1.055, vec3(2.4)), step(.04045, c)); }
vec3 azul(vec3 lin) { // só os azuis com cor e luz: o cinza do terno, o branco do pelo, a camisa e a boca ficam como estão
  vec3 h = hsv(paraSrgb(lin));
  float g = h.x * 360., w = smoothstep(.12, .35, h.y) * smoothstep(.22, .45, h.z) * (1. - smoothstep(40., 70., abs(g - 240.)));
  h.x = fract((g - 15. * w) / 360.); h.y = clamp(h.y * (1. + .5 * w), 0., 1.);
  return paraLinear(rgb(h));
}
`;

export async function lobo(canvas, url, { foto = false } = {}) {
  const r = new WebGLRenderer({ canvas, antialias: true, alpha: true, premultipliedAlpha: true, powerPreference: 'low-power', preserveDrawingBuffer: foto });
  r.outputColorSpace = SRGBColorSpace; r.toneMapping = NoToneMapping; r.setClearColor(0, 0);
  const cena = new Scene(), cam = new PerspectiveCamera(18, 1, .1, 100);
  const U = { uGiro: { value: 0 }, uIncl: { value: 0 }, uBaixo: { value: PESCOCO.baixo }, uAlto: { value: PESCOCO.alto }, uPivo: { value: PESCOCO.pivo } };

  const g = await new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).loadAsync(url);
  const m = g.scene; m.rotation.y = -Math.PI / 2; m.updateMatrixWorld(true); // o GLB do Tripo vem olhando para +X
  const caixa = new Box3().setFromObject(m), c = caixa.getCenter(new Vector3()), sz = caixa.getSize(new Vector3()), k = 2 / sz.y;
  const malhas = []; m.traverse((o) => { if (o.isMesh) malhas.push(o); });
  for (const o of malhas) { // a posição do mundo vai para a geometria: altura 2, centro na origem
    o.geometry.applyMatrix4(o.matrixWorld); o.geometry.translate(-c.x, -c.y, -c.z); o.geometry.scale(k, k, k);
    o.removeFromParent(); o.position.set(0, 0, 0); o.rotation.set(0, 0, 0); o.scale.set(1, 1, 1); o.updateMatrix();
    o.frustumCulled = false;
    const mat = o.material;
    mat.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, U);
      sh.vertexShader = sh.vertexShader.replace('void main() {', VERT + 'void main() {')
        .replace('#include <begin_vertex>', 'vec3 transformed = torce(position) * (position - uPivo) + uPivo;');
      sh.fragmentShader = sh.fragmentShader.replace('void main() {', FRAG + 'void main() {')
        .replace('#include <map_fragment>', '#include <map_fragment>\ndiffuseColor.rgb = azul(diffuseColor.rgb);');
    };
    mat.needsUpdate = true;
    cena.add(o);
  }
  // câmera de frente, enquadrando a altura toda (o canvas é quadrado, como a imagem de frente)
  cam.position.set(0, 0, 1 / Math.tan(MathUtils.degToRad(cam.fov / 2)) + sz.z * k / 2); cam.lookAt(0, 0, 0);

  let feito = '';
  return {
    tamanho(px) { r.setPixelRatio(1); r.setSize(px, px, false); feito = ''; },
    pose(giro, incl) { // graus; desenha só se mudou
      const chave = giro.toFixed(2) + ' ' + incl.toFixed(2);
      if (chave === feito) return false;
      U.uGiro.value = MathUtils.degToRad(giro); U.uIncl.value = MathUtils.degToRad(incl);
      r.render(cena, cam); feito = chave; return true;
    },
    largura: () => r.domElement.width,
  };
}
