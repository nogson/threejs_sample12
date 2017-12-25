
uniform sampler2D tDiffuse;
uniform float time;
uniform float distortion;
uniform float distortion2;
uniform float speed;
uniform float scrollSpeed;
varying vec2 vUv;

//シンプレックスノイズ
//https://github.com/ashima/webgl-noise/blob/master/src/noise2D.glsl
vec3 mod289(vec3 x) {
    return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec2 mod289(vec2 x) {
    return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec3 permute(vec3 x) {
    return mod289(((x * 34.0) + 1.0) * x);
}

float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, // (3.0-sqrt(3.0))/6.0,
        0.366025403784439, // 0.5*(sqrt(3.0)-1.0),
        -0.577350269189626, // -1.0 + 2.0 * C.x,
        0.024390243902439); // 1.0 / 41.0,
    vec2 i = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);

    vec2 i1;
    i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;

    i = mod289(i);
    // Avoid truncation effects in permutation,
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));

    vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
    m = m * m;
    m = m * m;

    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;

    m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);

    vec3 g;
    g.x = a0.x * x0.x + h.x * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
}

void main() {
   
    vec2 p = vUv;
    float y = p.y + time * speed;

    float n = snoise(vec2(y,0.0));
    float offset = snoise(vec2(y,0.0));

    offset = offset * distortion * 0.01;
    offset += snoise(vec2(y * 50.0,0.0)) * 0.01 * distortion2;

    //走査線
    float scanLine = abs(sin(p.y * 400.0 + time * 5.0)) * 0.7 + 0.3;

    //UV座標  
    vec2 u = vec2(fract(p.x + offset),fract(p.y + time * scrollSpeed * 0.5));
    vec4 color = vec4(1.0);
    color.r = texture2D(tDiffuse, u + vec2(0.01 * distortion2,0.0)).r;
    color.g = texture2D(tDiffuse, u + vec2(-0.01 * distortion2,0.0)).g;
    color.b = texture2D(tDiffuse, u + vec2(0.0,0.0)).b;

    gl_FragColor =  color * scanLine;

}