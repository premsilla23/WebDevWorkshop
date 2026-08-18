/**
 * The club mark: an isometric cube whose three visible faces each carry a
 * squared "C".
 *
 * Rather than placing nine hand-tuned paths, one unit "C" is defined in a 0–1
 * square and projected onto each rhombus with a matrix built from that face's
 * two edge vectors. The transform is deliberately non-uniform, which is what
 * gives the strokes their foreshortened, genuinely-isometric weight.
 */

/* Cube vertices (viewBox 0 0 200 220). */
const T = [100, 30];    // top
const UL = [30, 70];    // upper left
const UR = [170, 70];   // upper right
const M = [100, 110];   // middle — where all three faces meet
const LL = [30, 150];   // lower left
const LR = [170, 150];  // lower right
const B = [100, 190];   // bottom

const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];

/** matrix(u, v, origin) maps the unit square onto a face. */
const face = (origin, u, v) =>
    `matrix(${u[0]} ${u[1]} ${v[0]} ${v[1]} ${origin[0]} ${origin[1]})`;

const FACES = [
    { id: "top", transform: face(UL, sub(T, UL), sub(M, UL)) },
    { id: "left", transform: face(UL, sub(M, UL), sub(LL, UL)) },
    { id: "right", transform: face(M, sub(UR, M), sub(B, M)) },
];

/* A squared C in unit space, open toward the right. */
const C_PATH = "M0.8 0.2 L0.24 0.2 L0.24 0.8 L0.8 0.8";

export default function CCLogo({ className, animated = false, title }) {
    return (
        <svg
            viewBox="0 0 200 220"
            className={className}
            role={title ? "img" : "presentation"}
            aria-label={title}
            aria-hidden={title ? undefined : "true"}
            fill="none"
        >
            {/* cube silhouette + the three interior edges */}
            <g className="cc-edges">
                <path
                    d={`M${T} L${UR} L${LR} L${B} L${LL} L${UL} Z`}
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinejoin="round"
                />
                <path
                    d={`M${T} L${M} M${UL} L${M} M${UR} L${M} M${M} L${B}`}
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                />
            </g>

            {FACES.map(({ id, transform }, i) => (
                <g key={id} transform={transform} className={`cc-face cc-face-${id}`}>
                    <path
                        d={C_PATH}
                        pathLength="1"
                        stroke="currentColor"
                        strokeWidth="0.2"
                        strokeLinecap="butt"
                        strokeLinejoin="miter"
                        style={
                            animated
                                ? { animationDelay: `${0.2 + i * 0.3}s` }
                                : undefined
                        }
                    />
                </g>
            ))}
        </svg>
    );
}
