"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./ShaderLab.module.css";

const VERTEX = `#version 300 es
in vec2 a_position;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}`;

const DEFAULT_FRAGMENT = `#version 300 es
precision highp float;

uniform vec2  u_resolution;
uniform float u_time;
uniform vec2  u_mouse;

out vec4 outColor;

// Cheap value noise, smoothed.
float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x),
             mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
}

// Fractal brownian motion — noise stacked at halving amplitudes.
float fbm(vec2 p) {
  float total = 0.0;
  float amp = 0.5;
  for (int i = 0; i < 5; i++) {
    total += noise(p) * amp;
    p *= 2.02;
    amp *= 0.5;
  }
  return total;
}

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution) / u_resolution.y;
  float t = u_time * 0.06;

  // Warp the domain with more noise, then sample again.
  vec2 q = vec2(fbm(uv * 2.2 + t), fbm(uv * 2.2 + vec2(4.3, 1.7) - t));
  vec2 r = vec2(fbm(uv * 2.4 + 3.0 * q + vec2(1.7, 9.2)),
                fbm(uv * 2.4 + 3.0 * q + vec2(8.3, 2.8)));
  float f = fbm(uv * 2.0 + 3.5 * r);

  vec3 deep   = vec3(0.031, 0.043, 0.063);
  vec3 cyan   = vec3(0.369, 0.918, 0.831);
  vec3 violet = vec3(0.894, 0.365, 1.000);

  vec3 col = mix(deep, violet, clamp(f * f * 2.4, 0.0, 1.0));
  col = mix(col, cyan, clamp(length(r) * 0.85, 0.0, 1.0));

  // Lift the area around the pointer.
  vec2 m = (u_mouse - 0.5 * u_resolution) / u_resolution.y;
  col += 0.10 * cyan * smoothstep(0.55, 0.0, length(uv - m));

  // Vignette.
  col *= 1.0 - 0.55 * length(uv * vec2(0.75, 1.0));

  outColor = vec4(col, 1.0);
}`;

function compile(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const log = gl.getShaderInfoLog(shader) ?? "unknown error";
        gl.deleteShader(shader);
        return { shader: null, log };
    }
    return { shader, log: "" };
}

export default function ShaderLab() {
    const canvasRef = useRef(null);
    const glRef = useRef(null);
    const programRef = useRef(null);
    const rafRef = useRef(0);
    const mouseRef = useRef([0, 0]);
    const sourceRef = useRef(DEFAULT_FRAGMENT);

    const [source, setSource] = useState(DEFAULT_FRAGMENT);
    const [error, setError] = useState("");
    const [supported, setSupported] = useState(true);
    const [fps, setFps] = useState(0);

    /* ---------------- one-time GL setup ---------------- */
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const gl = canvas.getContext("webgl2", {
            antialias: false,
            powerPreference: "low-power",
        });
        if (!gl) {
            setSupported(false);
            return;
        }
        glRef.current = gl;

        const buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(
            gl.ARRAY_BUFFER,
            new Float32Array([-1, -1, 3, -1, -1, 3]),
            gl.STATIC_DRAW
        );

        const start = performance.now();
        let frames = 0;
        let lastFpsAt = start;
        let running = true;

        const resize = () => {
            const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
            const w = Math.round(canvas.clientWidth * dpr);
            const h = Math.round(canvas.clientHeight * dpr);
            if (canvas.width !== w || canvas.height !== h) {
                canvas.width = w;
                canvas.height = h;
            }
        };

        const render = (now) => {
            if (!running) return;
            const program = programRef.current;
            if (program) {
                resize();
                gl.viewport(0, 0, canvas.width, canvas.height);
                gl.useProgram(program);

                const position = gl.getAttribLocation(program, "a_position");
                gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
                gl.enableVertexAttribArray(position);
                gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

                gl.uniform2f(
                    gl.getUniformLocation(program, "u_resolution"),
                    canvas.width,
                    canvas.height
                );
                gl.uniform1f(gl.getUniformLocation(program, "u_time"), (now - start) / 1000);
                gl.uniform2f(
                    gl.getUniformLocation(program, "u_mouse"),
                    mouseRef.current[0],
                    mouseRef.current[1]
                );

                gl.drawArrays(gl.TRIANGLES, 0, 3);
            }

            frames += 1;
            if (now - lastFpsAt >= 1000) {
                setFps(Math.round((frames * 1000) / (now - lastFpsAt)));
                frames = 0;
                lastFpsAt = now;
            }
            rafRef.current = requestAnimationFrame(render);
        };

        rafRef.current = requestAnimationFrame(render);

        const onPointer = (event) => {
            const rect = canvas.getBoundingClientRect();
            const dpr = canvas.width / rect.width;
            mouseRef.current = [
                (event.clientX - rect.left) * dpr,
                (rect.height - (event.clientY - rect.top)) * dpr,
            ];
        };
        canvas.addEventListener("pointermove", onPointer);

        return () => {
            running = false;
            cancelAnimationFrame(rafRef.current);
            canvas.removeEventListener("pointermove", onPointer);
            if (programRef.current) gl.deleteProgram(programRef.current);
            gl.deleteBuffer(buffer);
        };
    }, []);

    /* ---------------- recompile when the source settles ---------------- */
    useEffect(() => {
        const timer = setTimeout(() => {
            const gl = glRef.current;
            if (!gl) return;

            const vs = compile(gl, gl.VERTEX_SHADER, VERTEX);
            const fs = compile(gl, gl.FRAGMENT_SHADER, source);

            if (!fs.shader) {
                setError(fs.log.trim());
                if (vs.shader) gl.deleteShader(vs.shader);
                return;
            }

            const program = gl.createProgram();
            gl.attachShader(program, vs.shader);
            gl.attachShader(program, fs.shader);
            gl.linkProgram(program);
            gl.deleteShader(vs.shader);
            gl.deleteShader(fs.shader);

            if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
                setError(gl.getProgramInfoLog(program)?.trim() ?? "link failed");
                gl.deleteProgram(program);
                return;
            }

            if (programRef.current) gl.deleteProgram(programRef.current);
            programRef.current = program;
            sourceRef.current = source;
            setError("");
        }, 400);

        return () => clearTimeout(timer);
    }, [source]);

    const lines = source.split("\n").length;

    if (!supported) {
        return (
            <div className={styles.fallback}>
                WebGL2 is unavailable in this browser, so the shader cannot run here.
            </div>
        );
    }

    return (
        <div className={styles.wrap}>
            <div className={styles.stage}>
                <canvas ref={canvasRef} className={styles.canvas} />
                <div className={styles.hud}>
                    <span className={error ? styles.bad : styles.good}>
                        {error ? "compile error" : "compiled"}
                    </span>
                    <span className={styles.fps}>{fps} fps</span>
                </div>
            </div>

            <div className={styles.editor}>
                <div className={styles.editorBar}>
                    <span className={styles.file}>fragment.glsl</span>
                    <span className={styles.meta}>{lines} lines</span>
                    <button
                        type="button"
                        className={styles.reset}
                        onClick={() => setSource(DEFAULT_FRAGMENT)}
                    >
                        reset
                    </button>
                </div>

                <textarea
                    className={styles.code}
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    spellCheck={false}
                    autoCapitalize="off"
                    autoCorrect="off"
                    aria-label="GLSL fragment shader source"
                />

                {error && <pre className={styles.error}>{error}</pre>}
            </div>
        </div>
    );
}
