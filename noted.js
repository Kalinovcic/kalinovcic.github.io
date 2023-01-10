function clamp01 (x)             { return Math.min(Math.max(x, 0), 1);   }
function lerp    (a, b, t)       { return a + t * (b - a);               }
function lerp01  (a, b, t)       { return lerp(a, b, clamp01(t));        }
function unlerp  (a, b, x)       { return (x - a) / (b - a);             }
function unlerp01(a, b, x)       { return clamp01(unlerp(a, b, x));      }
function remap   (a, b, x, c, d) { return lerp(c, d, unlerp  (a, b, x)); }
function remap01 (a, b, x, c, d) { return lerp(c, d, unlerp01(a, b, x)); }
function random  (from, to)      { return lerp(from, to, Math.random()); }

function hexRGB(r, g, b)
{
    let component = (c) => (c < 16 ? "0" : "") + Math.round(c).toString(16);
    return "#" + component(r) + component(g) + component(b);
}

function svgElement(parent, tag, kv, textContent)
{
    let namespace = "http://www.w3.org/2000/svg";
    let element = document.createElementNS(namespace, tag);
    parent.appendChild(element);
    for (let attribute of Object.keys(kv))
        element.setAttribute(attribute, kv[attribute]);
    if (textContent)
        element.textContent = textContent;
    return element;
}

function svgLine(parent, x1, y1, x2, y2, width, color)
{
    return svgElement(parent, "line", {
        "x1":           x1,
        "y1":           y1,
        "x2":           x2,
        "y2":           y2,
        "stroke-width": width || 2,
        "stroke":       color || "black",
    });
}

function svgText(parent, x, y, text, fontWeight, fontStyle, fontSize, fontFamily, color)
{
    return svgElement(parent, "text", {
        "x":           x,
        "y":           y,
        "fill":        color      || "black",
        "font-weight": fontWeight || "normal",
        "font-style":  fontStyle  || "normal",
        "font-size":   fontSize   || "35",
        "font-family": fontSize   || "sans-serif",
        "style":       "white-space: pre",
    }, text);
}


const frequencies = {
    "C":  [ 16.35, 32.70,  65.41, 130.81, 261.63, 523.25, 1046.50, 2093.00, 4186.01 ],
    "C#": [ 17.32, 34.65,  69.30, 138.59, 277.18, 554.37, 1108.73, 2217.46, 4434.92 ],
    "D":  [ 18.35, 36.71,  73.42, 146.83, 293.66, 587.33, 1174.66, 2349.32, 4698.63 ],
    "D#": [ 19.45, 38.89,  77.78, 155.56, 311.13, 622.25, 1244.51, 2489.02, 4978.03 ],
    "E":  [ 20.60, 41.20,  82.41, 164.81, 329.63, 659.25, 1318.51, 2637.02, 5274.04 ],
    "F":  [ 21.83, 43.65,  87.31, 174.61, 349.23, 698.46, 1396.91, 2793.83, 5587.65 ],
    "F#": [ 23.12, 46.25,  92.50, 185.00, 369.99, 739.99, 1479.98, 2959.96, 5919.91 ],
    "G":  [ 24.50, 49.00,  98.00, 196.00, 392.00, 783.99, 1567.98, 3135.96, 6271.93 ],
    "G#": [ 25.96, 51.91, 103.83, 207.65, 415.30, 830.61, 1661.22, 3322.44, 6644.88 ],
    "A":  [ 27.50, 55.00, 110.00, 220.00, 440.00, 880.00, 1760.00, 3520.00, 7040.00 ],
    "A#": [ 29.14, 58.27, 116.54, 233.08, 466.16, 932.33, 1864.66, 3729.31, 7458.62 ],
    "B":  [ 30.87, 61.74, 123.47, 246.94, 493.88, 987.77, 1975.53, 3951.07, 7902.13 ],
};

const bars = [
];

function parseNote(note)
{
    let spec = note.split(" ")[0];
    let text = note.split(" ")[1];

    let lhs      = spec.split("-")[0];
    let duration = spec.split("-")[1];

    let halfLonger = false;
    if (duration.slice(-1) === "*")
    {
        halfLonger = true;
        duration = duration.slice(0, -1);
    }

    let fraction = 1 / duration * (halfLonger ? 1.5 : 1.0);

    if (lhs === "X")
        return {
            rest:       true,
            text, fraction, duration, halfLonger
        };

    let octave = +lhs.slice(-1);
    let tone   =  lhs.slice(0, -1);

    let isFalloff = false;
    if (tone.slice(0, 1) === "x")
    {
        isFalloff = true;
        tone = tone.slice(1);
    }

    let line = octave * 7 + "CDEFGAB".indexOf(tone.slice(0, 1));
    return {
        rest:       false,
        text, fraction, duration, halfLonger, octave, tone, line, isFalloff
    };
}


const pathNote = {
     1: "M -2 8.4 c -2.3 0 -5.3 -0.8 -5.3 -6.1 c 0 -7.6 6.8 -9.9 9.9 -9.9 c 2.3 0 5.3 0.8 5.3 6.1 c 0 7.6 -6.1 9.9 -9.9 9.9 z M 0.2 9.9 c 9.1 0 18.2 -3.8 18.2 -9.9 s -9.1 -9.9 -18.2 -9.9 s -18.2 3.8 -18.2 9.9 s 9.1 9.9 18.2 9.9 z",
     2: "M 10.4 -4.8 c 0 -1.7 -1.3 -3 -3.1 -3 c -2.9 0 -14.9 8.2 -16.8 10.4 c -0.4 0.6 -0.8 1.3 -0.8 2.1 c 0 1.7 1.3 3 3.1 3 c 2.9 0 14.9 -8.2 16.8 -10.4 c 0.4 -0.6 0.8 -1.3 0.8 -2.1 z M 6.8 -9.7 c 4.4 0 5.7 2.3 5.7 4.9 c 0 2.4 -1.7 8.2 -5.4 10.8 c -4.4 3 -10.2 3.7 -13.5 3.7 c -4.4 0 -5.7 -2.3 -5.7 -4.9 c 0 -2.4 1.6 -8.2 5.4 -10.8 c 4.4 -3 10.2 -3.7 13.5 -3.7 z",
     4: "M 3.52 -9.68 c 3.96 0 7.48 1.98 7.48 6.16 c 0 6.38 -8.36 13.2 -15.84 13.2 c -3.96 0 -7.48 -1.98 -7.48 -6.16 c 0 -6.38 8.36 -13.2 15.84 -13.2 z",
     8: "M 3.52 -9.68 c 3.96 0 7.48 1.98 7.48 6.16 c 0 6.38 -8.36 13.2 -15.84 13.2 c -3.96 0 -7.48 -1.98 -7.48 -6.16 c 0 -6.38 8.36 -13.2 15.84 -13.2 z",
    16: "M 3.52 -9.68 c 3.96 0 7.48 1.98 7.48 6.16 c 0 6.38 -8.36 13.2 -15.84 13.2 c -3.96 0 -7.48 -1.98 -7.48 -6.16 c 0 -6.38 8.36 -13.2 15.84 -13.2 z",
    32: "M 3.52 -9.68 c 3.96 0 7.48 1.98 7.48 6.16 c 0 6.38 -8.36 13.2 -15.84 13.2 c -3.96 0 -7.48 -1.98 -7.48 -6.16 c 0 -6.38 8.36 -13.2 15.84 -13.2 z",
    "x": "M 10 -4 L -2 8 L -1 9 L 11 -3 L 10 -4 M -1 -4 L -2 -3 L 10 9 L 11 8 L -1 -4",
};

const pathNoteLeg = {
     1: "M -2 8.4 c -2.3 0 -5.3 -0.8 -5.3 -6.1 c 0 -7.6 6.8 -9.9 9.9 -9.9 c 2.3 0 5.3 0.8 5.3 6.1 c 0 7.6 -6.1 9.9 -9.9 9.9 z M 0.2 9.9 c 9.1 0 18.2 -3.8 18.2 -9.9 s -9.1 -9.9 -18.2 -9.9 s -18.2 3.8 -18.2 9.9 s 9.1 9.9 18.2 9.9 z",
     2: "M 12.6 -63.8 L 12.6 -3.52 L 11.72 -3.52 L 11.72 -63.8",
     4: "M 11 -63.8 L 11 -3.52 L 10.12 -3.52 L 10.12 -63.8",
     8: "M 11 -63.8 L 11 -3.52 L 10.12 -3.52 L 10.12 -63.8"
      + "M 10.12 -46.2 v -17.6 h 0.88 c 0 13.86 14.74 23.76 14.74 37.62 c 0 5.06 -1.1 9.9 -2.86 14.74 c -0.22 0.44 -0.88 0.88 -1.32 0.88 c -0.88 0 -1.76 -0.66 -1.54 -1.76 c 1.76 -4.4 2.86 -9.02 2.86 -13.64 c 0 -7.48 -6.82 -14.74 -11.88 -20.02 h -0.88 z",
    16: "M 11 -63.8 L 11 -3.52 L 10.12 -3.52 L 10.12 -63.8"
      + "M 10.12 -51.54 v -12.32 h 0.88 c 0 9.702 14.74 16.632 14.74 26.334 c 0 3.542 -1.1 6.93 -2.86 10.318 c -0.22 0.308 -0.88 0.616 -1.32 0.616 c -0.88 0 -1.76 -0.462 -1.54 -1.232 c 1.76 -3.08 2.86 -6.314 2.86 -9.548 c 0 -5.236 -6.82 -10.318 -11.88 -14.014 h -0.88 z"
      + "M 10.12 -36.54 v -12.32 h 0.88 c 0 9.702 14.74 16.632 14.74 26.334 c 0 3.542 -1.1 6.93 -2.86 10.318 c -0.22 0.308 -0.88 0.616 -1.32 0.616 c -0.88 0 -1.76 -0.462 -1.54 -1.232 c 1.76 -3.08 2.86 -6.314 2.86 -9.548 c 0 -5.236 -6.82 -10.318 -11.88 -14.014 h -0.88 z",
    32: "M 11 -78.8 L 11 -3.52 L 10.12 -3.52 L 10.12 -78.8"
      + "M 10.12 -66.54 v -12.32 h 0.88 c 0 9.702 14.74 16.632 14.74 26.334 c 0 3.542 -1.1 6.93 -2.86 10.318 c -0.22 0.308 -0.88 0.616 -1.32 0.616 c -0.88 0 -1.76 -0.462 -1.54 -1.232 c 1.76 -3.08 2.86 -6.314 2.86 -9.548 c 0 -5.236 -6.82 -10.318 -11.88 -14.014 h -0.88 z"
      + "M 10.12 -51.54 v -12.32 h 0.88 c 0 9.702 14.74 16.632 14.74 26.334 c 0 3.542 -1.1 6.93 -2.86 10.318 c -0.22 0.308 -0.88 0.616 -1.32 0.616 c -0.88 0 -1.76 -0.462 -1.54 -1.232 c 1.76 -3.08 2.86 -6.314 2.86 -9.548 c 0 -5.236 -6.82 -10.318 -11.88 -14.014 h -0.88 z"
      + "M 10.12 -36.54 v -12.32 h 0.88 c 0 9.702 14.74 16.632 14.74 26.334 c 0 3.542 -1.1 6.93 -2.86 10.318 c -0.22 0.308 -0.88 0.616 -1.32 0.616 c -0.88 0 -1.76 -0.462 -1.54 -1.232 c 1.76 -3.08 2.86 -6.314 2.86 -9.548 c 0 -5.236 -6.82 -10.318 -11.88 -14.014 h -0.88 z",
};

const pathRest = {
     1: "M -14.8 -12 L -15 -11.6 L -15 -0.2 L -14.9 11.6 L -14.8 11.8 L -14.6 12.2 L -0.1 12.4 L 14.4 12.4 L 14.7 11.8 L 14.9 11.4 L 14.9 -0.2 L 14.9 -11.8 L 14.7 -12 L 14.5 -12.6 L 0 -12.6 L -14.5 -12.6 L -14.8 -12 z",
     2: "M -14.8 -6 L -15 -5.8 L -15 -0.1 L -14.9 5.8 L -14.8 5.9 L -14.6 6.1 L -0.1 6.2 L 14.4 6.2 L 14.7 5.9 L 14.9 5.7 L 14.9 -0.1 L 14.9 -5.9 L 14.7 -6 L 14.5 -6.3 L 0 -6.3 L -14.5 -6.3 L -14.8 -6 z",
     4: "M -3 -27.9 C -3.5 -27.7 -3.9 -26.9 -3.6 -26.3 C -3.5 -26.3 -2.7 -25.3 -1.9 -24.3 C -0.1 -22.2 0.2 -21.7 0.6 -20.8 C 2.2 -17.5 1.3 -13.3 -1.5 -10.7 C -1.7 -10.4 -2.7 -9.5 -3.7 -8.8 C -6.5 -6.4 -7.8 -5 -8.2 -3.8 C -8.4 -3.5 -8.4 -3.2 -8.4 -2.7 C -8.5 -1.6 -8.4 -1.5 -5.1 2.3 C -0.7 7.6 2.5 11.4 2.8 11.6 L 3 11.8 L 2.7 11.7 C -1.7 9.9 -6.6 9 -8.3 9.8 C -8.9 10 -9.2 10.3 -9.4 10.9 C -10.1 12.2 -9.9 14.2 -9 17.2 C -8.1 19.8 -6.3 23.3 -4.6 26 C -3.9 27.1 -2.5 28.8 -2.3 28.9 C -2.1 29.1 -1.8 29.1 -1.5 28.9 C -1.3 28.6 -1.3 28.3 -1.8 27.8 C -3.5 25.4 -4.2 20.5 -3.3 17.8 C -2.9 16.6 -2.4 16 -1.5 15.6 C 0.8 14.6 5.9 15.8 8 18 C 8.2 18.1 8.5 18.5 8.7 18.5 C 9.2 18.8 10 18.5 10.3 17.9 C 10.6 17.3 10.4 17 9.7 16.1 C 8.3 14.5 4.3 9.7 3.7 9 C 2.3 7.3 1.6 5.7 1.5 3.7 C 1.4 1.2 2.4 -1.5 4.4 -3.3 C 4.6 -3.6 5.6 -4.5 6.6 -5.2 C 9.5 -7.7 10.7 -9 11.2 -10.3 C 11.5 -11.3 11.4 -12.3 10.7 -13.2 C 10.4 -13.4 7.6 -16.8 4.4 -20.8 C -0.1 -26 -1.7 -27.9 -1.9 -28 C -2.3 -28.1 -2.7 -28.1 -3 -27.9 z",
     8: "M -8 -16 c -2.1 0.4 -3.7 1.8 -4.4 3.8 c -0.2 0.6 -0.2 0.8 -0.2 1.7 c 0 1.2 0.1 1.8 0.6 2.8 c 0.8 1.6 2.5 2.9 4.4 3.3 c 2 0.6 5.3 0.1 9.2 -1.2 l 1 -0.3 l -4.7 13 l -4.6 13 c 0 0 0.2 0.1 0.4 0.3 c 0.5 0.3 1.3 0.5 1.8 0.5 c 1 0 2.2 -0.5 2.3 -1 c 0 -0.2 2.2 -7.7 4.9 -16.7 l 4.8 -16.5 l -0.2 -0.2 c -0.4 -0.5 -1.2 -0.6 -1.7 -0.3 c -0.2 0.2 -0.4 0.5 -0.6 0.7 c -0.7 1.2 -2.5 3.3 -3.5 4.1 c -0.9 0.7 -1.4 0.8 -2.2 0.5 c -0.7 -0.4 -1 -0.8 -1.4 -3 c -0.5 -2.1 -1 -3.1 -2.2 -3.9 c -1.1 -0.7 -2.5 -1 -3.8 -0.6 z",
    16: "M -3.2 -14.6 C -5.3 -14.2 -6.9 -12.8 -7.6 -10.8 C -7.8 -10.2 -7.8 -10 -7.8 -9.1 C -7.8 -7.9 -7.7 -7.3 -7.1 -6.3 C -6.3 -4.7 -4.7 -3.5 -2.7 -3 C -0.8 -2.4 2.4 -2.8 6.3 -4.1 C 6.8 -4.3 7.3 -4.5 7.3 -4.4 C 7.3 -4.3 3.7 7.3 3.5 7.7 C 3.1 8.7 1.8 10.6 0.6 11.8 C -0.5 13 -1.1 13.2 -2 12.8 C -2.7 12.4 -2.9 12 -3.4 9.8 C -3.8 8.2 -4.1 7.4 -4.7 6.7 C -6.4 4.9 -9.3 4.7 -11.5 6.1 C -12.6 6.8 -13.4 7.9 -13.8 9.1 C -14 9.8 -14 9.9 -14 10.8 C -14 12 -13.9 12.6 -13.4 13.6 C -12.6 15.2 -10.9 16.5 -9 16.9 C -8.1 17.2 -5.9 17.2 -4.3 16.9 C -3.1 16.7 -1.6 16.3 0 15.8 C 0.6 15.6 1.2 15.4 1.2 15.5 C 1.2 15.5 -6.7 40.9 -6.8 41.3 C -6.8 41.4 -6.2 41.9 -5.5 42 C -4.9 42.3 -4.3 42.3 -3.6 42 C -3 41.9 -2.4 41.5 -2.4 41.2 C -2.3 41.2 0.9 29.1 4.8 14.5 L 11.9 -12 L 11.8 -12.2 C 11.4 -12.7 10.8 -12.8 10.2 -12.5 C 9.9 -12.4 9.9 -12.4 9 -11 C 8.2 -9.7 7 -8.3 6.4 -7.7 C 5.5 -7 5.1 -6.8 4.3 -7.1 C 3.5 -7.5 3.3 -7.9 2.8 -10.1 C 2.3 -12.2 1.8 -13.2 0.6 -14 C -0.5 -14.7 -2 -14.9 -3.2 -14.6 z",
    32: "M -4.8 -33.5 C -6.9 -33.1 -8.5 -31.7 -9.2 -29.7 C -9.4 -29.1 -9.4 -28.9 -9.4 -28 C -9.4 -27.2 -9.4 -26.8 -9.2 -26.4 C -8.7 -24.6 -7.5 -23.3 -5.8 -22.5 C -4.6 -21.8 -4 -21.8 -2.4 -21.8 C -0.3 -21.8 1.5 -22.1 4.3 -22.9 C 5 -23.2 5.5 -23.3 5.5 -23.3 C 5.6 -23.3 4.9 -20.5 3.9 -17.2 C 2.7 -12.5 2.3 -11 2.1 -10.5 C 1.5 -9.3 0.1 -7.5 -0.8 -6.7 C -1.6 -6 -2 -5.8 -2.8 -6.1 C -3.6 -6.5 -3.8 -6.9 -4.3 -9.1 C -4.7 -10.7 -5 -11.5 -5.6 -12.2 C -7.3 -14 -10.2 -14.3 -12.4 -12.8 C -13.5 -12.1 -14.2 -11 -14.7 -9.8 C -14.9 -9.2 -14.9 -9 -14.9 -8.1 C -14.9 -6.9 -14.8 -6.3 -14.2 -5.3 C -13.5 -3.7 -11.8 -2.5 -9.9 -2 C -9 -1.7 -6.7 -1.7 -5.2 -2 C -4 -2.2 -2.5 -2.6 -0.9 -3.1 C -0.2 -3.3 0.3 -3.5 0.3 -3.5 C 0.3 -3.4 -2.8 8.7 -3 8.9 C -3.6 10.3 -4.9 12 -5.9 12.9 C -6.9 14 -7.5 14.1 -8.3 13.8 C -9.1 13.4 -9.3 13 -9.8 10.8 C -10.2 9.2 -10.5 8.4 -11.1 7.7 C -12.8 5.9 -15.7 5.7 -17.9 7.1 C -19 7.8 -19.7 8.9 -20.2 10.1 C -20.4 10.8 -20.4 10.9 -20.4 11.8 C -20.4 12.7 -20.4 13 -20.2 13.5 C -19.7 15.2 -18.5 16.6 -16.8 17.4 C -15.5 18 -15 18.1 -13.3 18.1 C -12 18.1 -11.6 18.1 -10.6 17.9 C -9.1 17.7 -7.6 17.2 -6 16.7 L -4.9 16.3 L -4.9 16.6 C -5 16.9 -11.7 42.1 -11.8 42.2 C -11.9 42.6 -10.4 43.2 -9.5 43.2 C -8.7 43.2 -7.4 42.7 -7.3 42.2 C -7.2 42.2 -3.4 25.7 1.4 5.6 C 9.9 -30.8 9.9 -30.8 9.8 -31.1 C 9.5 -31.4 9.1 -31.5 8.6 -31.5 C 8.1 -31.5 7.8 -31.2 7.3 -30.3 C 6.2 -28.4 4.9 -26.7 4.2 -26.1 C 3.7 -25.8 3.3 -25.8 2.7 -26 C 1.9 -26.5 1.7 -26.8 1.2 -29 C 0.7 -31.2 0.2 -32.1 -1 -32.9 C -2.1 -33.6 -3.6 -33.9 -4.8 -33.5 z"
};



let context;

function playSound(samples)
{
    let array = new Float32Array(samples.length)
    for (let i = 0; i < samples.length; i++)
        array[i] = samples[i] || 0;

    let buffer = context.createBuffer(1, array.length, context.sampleRate)
    buffer.copyToChannel(array, 0)

    let source = context.createBufferSource();
    source.buffer = buffer;
    source.connect(context.destination);
    source.start(0);
}

function generateTone(samples, frequency, volume, time, duration)
{
    let firstSample  = Math.round(context.sampleRate * time);
    let countSamples = Math.round(context.sampleRate * duration);

    let sineFactor = (Math.PI * 2) / (context.sampleRate / frequency);
    for (let sample = 0; sample < countSamples; sample++)
    {
        let index = firstSample + sample;
        samples[index] = (samples[index] || 0) + Math.sin(sample * sineFactor) * volume;
    }
}

document.getElementById("play").addEventListener("click", () =>
{
    if (!context)
    {
        window.AudioContext = window.AudioContext || window.webkitAudioContext;
        context = new AudioContext();
    }

    let samples = [];

    let time = 0;
    for (let bar of bars)
    {
        let barTime = 4 / 92 * 60;
        for (let note of bar)
        {
            note = parseNote(note);

            let timeDuration = barTime * note.fraction;
            if (!note.rest)
            {
                let frequency = frequencies[note.tone][note.octave];
                generateTone(samples, frequency, 0.5, time, timeDuration - 0.05);
            }
            time += timeDuration;
        }
    }

    playSound(samples);
});




let paper = document.querySelector(".paper");
if (paper)
{
    let vw = paper.viewBox.baseVal.width;
    let vh = paper.viewBox.baseVal.height;

    let barsPerLine = 2;
    let barPerLine  = 0;

    let x1 = 200;
    let x2 = vw - x1;
    let x;
    let y  = 300;
    for (let bar of bars)
    {
        let baseLine = 3 * 7 + 2;
        if (barPerLine == 0)
            for (let line = 0; line <= 4; line++)
                svgLine(paper, x1, y - line * 25, x2, y - line * 25, 2, "#888");

        let barPadding = 30;
        let barWidthFull = (x2 - x1) / barsPerLine;
        let barWidth = barWidthFull - barPadding;
        x = x1 + barWidthFull * barPerLine;

        svgLine(paper, x,                y, x,                y - 100, 2, "#888");
        svgLine(paper, x + barWidthFull, y, x + barWidthFull, y - 100, 2, "#888");
        x += barPadding;

        for (let note of bar)
        {
            note = parseNote(note);

            let timeWidth = barWidth * note.fraction;
            x += timeWidth * (note.duration > 1 ? 0 : 0.5);

            let noteX = x;
            let noteY = y - ((note.line || (baseLine + 4)) - baseLine) * 12.5;

            let text = note.text || "";
            if (text.slice(-1) === "-")
                text = text.slice(0, -1);

            let textElement = svgText(paper, noteX, y + 60, text);
            textElement.setAttribute("transform", `translate(${-textElement.getBBox().width * 0.5}, 0)`)

            let path = null;
            let legPath = null;
            if (note.rest)
                path = pathRest[note.duration];
            else
            {
                path = pathNote[note.isFalloff ? "x" : note.duration];
                legPath = pathNoteLeg[note.duration];
            }

            let transform = `translate(${noteX} ${noteY})`;
            if (path)
                svgElement(paper, "path", { "d": path, "fill": "black", "transform": transform, });

            if (note.line > baseLine + 4)
                transform = `translate(${noteX - 22} ${noteY}) scale(1 -1)`;

            if (legPath)
                svgElement(paper, "path", { "d": legPath, "fill": "black", "transform": transform, });

            if (note.halfLonger)
                svgElement(paper, "circle", { "cx": noteX + 20, "cy": noteY, "r": 3, "fill": "black" });

            x += timeWidth * (note.duration > 1 ? 1 : 0.5);
        }

        if (++barPerLine == barsPerLine)
        {
            y += 220;
            barPerLine = 0;
        }
    }
}
