
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
        "stroke-width": width || 1.5,
        "stroke":       color || "#f8f8f8",
    });
}

function svgText(parent, x, y, text, fontWeight, fontStyle, fontSize, fontFamily, color)
{
    return svgElement(parent, "text", {
        "x":           x,
        "y":           y,
        "fill":        color      || "#f8f8f8",
        "font-weight": fontWeight || "normal",
        "font-style":  fontStyle  || "normal",
        "font-size":   fontSize   || "8px",
        "font-family": fontSize   || "sans-serif",
        "white-space": "pre",
    }, text);
}


let chart = document.querySelector(".work-and-education-chart");
if (chart)
{
    let vw = chart.viewBox.baseVal.width;
    let vh = chart.viewBox.baseVal.height;
    let margin = 10;
    let cx = Math.floor(vw / 2);

    let yearLo = 2016;
    let yearHi = 2023.5;
    let yearToY = (year, month) =>
    {
        let outerMargin = 5;
        if (month) year += (month - 1) / 12;
        let result = Math.floor(remap(yearHi, yearLo, year, margin, vh - margin));
        return isNaN(result) ? -outerMargin : Math.min(result, vh + outerMargin);
    };

    let experience = [];
    for (let it of theExperience)
        experience.push({ ...it });

    let categoryOrder = [ "education", "education-work", "programming-work" ];

    let categoryColors = {
        "education": {
            from: { r: 160, g: 196, b: 255 },
            to:   { r: 156, g: 246, b: 255 },
        },
        "education-work": {
            from: { r: 189, g: 178, b: 255 },
            to:   { r: 255, g: 198, b: 255 },
        },
        "programming-work": {
            from: { r: 255, g: 174, b: 173 },
            to:   { r: 253, g: 255, b: 182 },
        },
    };

    for (let category of categoryOrder)
    {
        let count = 0;
        for (let it of experience)
            if (it.category === category)
                count++;
        categoryColors[category].count = count;
        categoryColors[category].index = 0;
    }

    experience.sort((a, b) =>
    {
        let ya = yearToY(a.toYear, a.toMonth + 1);
        let yb = yearToY(b.toYear, b.toMonth + 1);
        if (ya !== yb) return ya - yb;
        ya = yearToY(a.fromYear, a.fromMonth);
        yb = yearToY(b.fromYear, b.fromMonth);
        return ya - yb;
    });

    for (let it of experience)
    {
        let category = it.category;

        let colorA = categoryColors[category].from;
        let colorB = categoryColors[category].to;
        let colorT = unlerp(0, categoryColors[category].count - 1, categoryColors[category].index);
        categoryColors[category].index++;

        let color = {
            r: lerp(colorA.r, colorB.r, colorT),
            g: lerp(colorA.g, colorB.g, colorT),
            b: lerp(colorA.b, colorB.b, colorT),
        };

        it.fillColor = hexRGB(color.r, color.g, color.b);

        let stroke = {
            r: lerp(color.r, 255, 0.5),
            g: lerp(color.g, 255, 0.5),
            b: lerp(color.b, 255, 0.5),
        };
        it.strokeColor = hexRGB(stroke.r, stroke.g, stroke.b);
    }


    experience.sort((a, b) =>
    {
        let ia = categoryOrder.indexOf(a.category);
        let ib = categoryOrder.indexOf(b.category);
        if (ia === ib) return b.significance - a.significance;
        return ia - ib;
    });

    for (let it of experience)
    {
        let isEducation = it.category === "education";

        let y1 = yearToY(it.fromYear, it.fromMonth);
        let y2 = yearToY(it.toYear,   it.toMonth + 1);
        let w  = remap01(0, 1, it.significance, 20, 50);
        let x  = cx + (isEducation ? w : -w);

        it.renderedLine = { x: x, y1: y1, y2: y2 };

        svgElement(chart, "rect", {
            "x":                Math.min(x, cx),
            "y":                y2,
            "width":            w,
            "height":           y1 - y2,
            "fill":             it.fillColor,
            "fill-opacity":     0.6,
            "stroke":           it.strokeColor,
            "stroke-width":     1.0,
            "stroke-opacity":   1.0,
        });
    }

    experience.sort((a, b) =>
    {
        if (a.category === "education" && b.category !== "education") return  1;
        if (a.category !== "education" && b.category === "education") return -1;
        let ya = yearToY(a.toYear, a.toMonth + 1);
        let yb = yearToY(b.toYear, b.toMonth + 1);
        if (ya !== yb) return ya - yb;
        ya = yearToY(a.fromYear, a.fromMonth);
        yb = yearToY(b.fromYear, b.fromMonth);
        return ya - yb;
    });

    svgLine(chart, vw / 2, 0, vw / 2, vh);
    for (let year = yearLo; year <= yearHi; year++)
    {
        let y = yearToY(year);
        let w = (year % 5 == 0) ? 15 : 8;
        svgLine(chart, cx - w, y, cx + w, y);
        svgText(chart, cx + 4, y - 4, year);
    }
    
    let fadeHeight = 30;
    svgElement(chart, "rect", { x: 0, y: 0,               width: vw, height: fadeHeight, fill: "url(#gradient-fade-top)"    });
    svgElement(chart, "rect", { x: 0, y: vh - fadeHeight, width: vw, height: fadeHeight, fill: "url(#gradient-fade-bottom)" });

    let leftY  = 20;
    let rightY = 20;
    for (let it of experience)
    {
        let isEducation = it.category === "education";
        let y = isEducation ? rightY : leftY;
        let x = isEducation ? cx + 70 : margin;

        y = Math.max(y, lerp(it.renderedLine.y1, it.renderedLine.y2, 0.8));

        let lastText = null;
        let addText = (text, fontWeight, fontStyle, url) =>
        {
            if (!text) return;

            let parent = chart;
            if (url)
                parent = svgElement(chart, "a", { href: url, target: "_blank" });

            for (let line of text.split("\n"))
            {
                if (!line)
                {
                    y += 2;
                    continue;
                }
                y += 10;
                lastText = svgText(parent, x, y, line, fontWeight, fontStyle);
                if (url)
                    lastText.setAttribute("text-decoration", "underline");
            }
            y += 2;
        };

        // addText(it.fromYear + " - " + (it.toYear || "present"));
        addText(it.name, "bold");
        if (lastText)
        {
            let box = lastText.getBBox();
            let lineX = isEducation ? (box.x - 4) : (box.x + box.width + 4);
            let lineY = lerp(it.renderedLine.y1, it.renderedLine.y2, 0.5);
            svgElement(chart, "line", {
                "x1":             lineX,
                "y1":             box.y + box.height * 0.5,
                "x2":             it.renderedLine.x,
                "y2":             lineY,
                "stroke":         it.strokeColor,
                "stroke-width":   1,
                "stroke-opacity": 0.8,
                "stroke-dasharray": "4 2"
            });
        }
        addText(it.at, "normal", "italic", it.atURL);
        addText(it.location);
        addText(it.extra);

        y += 10;
        if (isEducation)
            rightY = y;
        else
            leftY = y;
    }
}
