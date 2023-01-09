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


let paper = document.querySelector(".paper");
if (paper)
{
    let vw = paper.viewBox.baseVal.width;
    let vh = paper.viewBox.baseVal.height;
    console.log(paper.viewBox.baseVal);

    let bars = [
    ];

    let barsPerLine = 3;
    let barPerLine = 0;

    let x1 = 200;
    let x2 = vw - x1;
    let x;
    let y  = 300;
    for (let bar of bars)
    {
        let baseLine = 3 * 6 + 2;
        if (barPerLine == 0)
        {
            x = x1;
            for (let line = 0; line <= 4; line++)
                svgLine(paper, x1, y - line * 25, x2, y - line * 25, 2, "#888");
        }

        svgLine(paper, x, y, x, y - 100, 2, "#888");

        for (let note of bar)
        {
            let octave    = +note.split("-")[0].slice(-1);
            let tone      =  note.split("-")[0].slice(0, -1);
            let duration  =  note.split(" ")[0].split("-")[1];
            let text      =  note.split(" ")[1];

            let line = octave * 6 + "CDEFGAB".indexOf(tone.slice(0, 1));
            // let frequency = frequencies[tone][octave];
            // console.log(tone, octave, frequency, duration, text, line);

            let timeWidth = (x2 - x1) / 3 / duration;
            x += timeWidth * 0.5;

            let noteX = x;
            let noteY = y - (line - baseLine) * 12.5;
            let noteR = 12;
            let legW = 3;
            let legH = 60;
            let legX = noteX + noteR - (duration > 2 ? legW * 0.5 : 0);

            let flags = Math.max(Math.log2(duration) - 2, 0);
            legH += Math.max(flags - 2, 0) * 15;

            svgText(paper, noteX - 10, y + 60, text);
            svgElement(paper, "ellipse", {
                "cx":     noteX,
                "cy":     noteY,
                "rx":     noteR,
                "ry":     noteR * 0.75,
                "fill":   duration > 2 ? "black" : "transparent",
                "stroke": duration > 2 ? "transparent" : "black",
                "stroke-width": legW
            });

            if (duration > 1)
                svgLine(paper, legX, noteY, legX, noteY - legH, legW);

            for (let i = 0; i < flags; i++)
            {
                let flagY = noteY - legH + i * 15;
                svgElement(paper, "path", {
                    "d": "M 0 0 L 0 -3 C 0 1 3 -1 2 4 C 2 2 2 1 0 0",
                    "transform": `translate(${legX - legW * 0.5} ${flagY}) scale(10 8)`,
                    "fill": "black"
                });
            }

            x += timeWidth * 0.5;
        }

        if (++barPerLine == barsPerLine)
        {
            y += 250;
            barPerLine = 0;
        }
    }
}
