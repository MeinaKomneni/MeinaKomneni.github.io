mixins.map = {
    mounted() {
        if (!window.__mapData) return;
        this.$nextTick(() => initKnowledgeMap(window.__mapData));
    }
};

function initKnowledgeMap(data) {
    const container = document.getElementById("map-container");
    const svg = d3.select("#map-svg");
    if (!container || svg.empty()) return;

    const width = container.clientWidth;
    const height = Math.max(container.clientHeight, 600);
    svg.attr("width", width).attr("height", height);

    const tagColors = [
        "#66afef", "#00bcd4", "#03a9f4", "#00a596",
        "#ff7d73", "#ffa2c4", "#9abbf7", "#ffbbf4"
    ];

    const normalizedTagMap = {};
    data.tags.forEach(t => {
        const key = t.toLowerCase();
        if (!normalizedTagMap[key]) normalizedTagMap[key] = t;
    });
    const uniqueTags = Object.values(normalizedTagMap);

    const tagColorMap = {};
    uniqueTags.forEach((t, i) => {
        tagColorMap[t.toLowerCase()] = tagColors[i % tagColors.length];
    });

    const nodes = [];
    const links = [];
    const nodeMap = {};

    uniqueTags.forEach(tag => {
        const id = "tag:" + tag.toLowerCase();
        const node = { id, label: tag, type: "tag", color: tagColorMap[tag.toLowerCase()] };
        nodes.push(node);
        nodeMap[id] = node;
    });

    data.posts.forEach(post => {
        const id = "post:" + post.path;
        const primaryColor = post.tags.length > 0
            ? tagColorMap[post.tags[0].toLowerCase()]
            : "#9abbf7";
        const normalizedTags = post.tags.map(t => t.toLowerCase());
        const node = {
            id, label: post.title, type: "post",
            path: post.path, date: post.date,
            description: post.description,
            tags: post.tags, normalizedTags: normalizedTags,
            color: primaryColor
        };
        nodes.push(node);
        nodeMap[id] = node;

        const seen = new Set();
        normalizedTags.forEach(tag => {
            if (seen.has(tag)) return;
            seen.add(tag);
            links.push({
                source: "tag:" + tag,
                target: id,
                color: tagColorMap[tag] || "#ccc"
            });
        });
    });

    const defs = svg.append("defs");

    defs.append("marker")
        .attr("id", "arrowhead")
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", 28)
        .attr("refY", 0)
        .attr("markerWidth", 6)
        .attr("markerHeight", 6)
        .attr("orient", "auto")
        .append("path")
        .attr("d", "M0,-5L10,0L0,5")
        .attr("fill", "#c0d4ee");

    defs.append("filter")
        .attr("id", "glow")
        .html('<feGaussianBlur stdDeviation="3" result="blur"/>' +
              '<feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>');

    defs.append("filter")
        .attr("id", "shadow")
        .html('<feDropShadow dx="0" dy="2" stdDeviation="4" flood-color="#00000020"/>');

    const g = svg.append("g");

    const zoom = d3.zoom()
        .scaleExtent([0.2, 4])
        .on("zoom", (event) => g.attr("transform", event.transform));
    svg.call(zoom);

    window.resetZoom = function() {
        svg.transition().duration(750).call(
            zoom.transform, d3.zoomIdentity.translate(width / 2, height / 2).scale(0.8).translate(-width / 2, -height / 2)
        );
    };

    const simulation = d3.forceSimulation(nodes)
        .force("link", d3.forceLink(links).id(d => d.id).distance(d => {
            return d.source.type === "tag" ? 160 : 120;
        }).strength(0.6))
        .force("charge", d3.forceManyBody().strength(d => d.type === "tag" ? -800 : -400))
        .force("center", d3.forceCenter(width / 2, height / 2))
        .force("collision", d3.forceCollide().radius(d => d.type === "tag" ? 55 : 45))
        .force("x", d3.forceX(width / 2).strength(0.05))
        .force("y", d3.forceY(height / 2).strength(0.05));

    const link = g.append("g")
        .selectAll("line")
        .data(links)
        .join("line")
        .attr("stroke", d => d.color)
        .attr("stroke-opacity", 0.35)
        .attr("stroke-width", 2)
        .attr("marker-end", "url(#arrowhead)");

    const node = g.append("g")
        .selectAll("g")
        .data(nodes)
        .join("g")
        .attr("class", d => "map-node map-node-" + d.type)
        .style("cursor", d => d.type === "post" ? "pointer" : "default")
        .call(d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended));

    node.filter(d => d.type === "tag").each(function(d) {
        const el = d3.select(this);
        el.append("circle")
            .attr("r", 36)
            .attr("fill", d.color)
            .attr("fill-opacity", 0.15)
            .attr("stroke", d.color)
            .attr("stroke-width", 2.5)
            .attr("filter", "url(#glow)");
        el.append("circle")
            .attr("r", 28)
            .attr("fill", d.color)
            .attr("fill-opacity", 0.85)
            .attr("filter", "url(#shadow)");
        el.append("text")
            .text(d.label)
            .attr("text-anchor", "middle")
            .attr("dy", "0.35em")
            .attr("fill", "#fff")
            .attr("font-size", "13px")
            .attr("font-weight", "700")
            .attr("font-family", "'Noto Sans SC', sans-serif")
            .style("pointer-events", "none");
    });

    node.filter(d => d.type === "post").each(function(d) {
        const el = d3.select(this);
        const titleLen = d.label.length;
        const boxW = Math.min(Math.max(titleLen * 10 + 30, 100), 200);
        const boxH = 42;

        el.append("rect")
            .attr("x", -boxW / 2)
            .attr("y", -boxH / 2)
            .attr("width", boxW)
            .attr("height", boxH)
            .attr("rx", 21)
            .attr("ry", 21)
            .attr("fill", "#fff")
            .attr("stroke", d.color)
            .attr("stroke-width", 2)
            .attr("filter", "url(#shadow)");

        const displayTitle = d.label.length > 16
            ? d.label.substring(0, 15) + "…"
            : d.label;

        el.append("text")
            .text(displayTitle)
            .attr("text-anchor", "middle")
            .attr("dy", "0.35em")
            .attr("fill", "#1e3e3f")
            .attr("font-size", "12px")
            .attr("font-weight", "600")
            .attr("font-family", "'Noto Sans SC', sans-serif")
            .style("pointer-events", "none");
    });

    const tooltip = d3.select("#map-container")
        .append("div")
        .attr("class", "map-tooltip")
        .style("opacity", 0);

    node.filter(d => d.type === "post")
        .on("click", (event, d) => {
            window.location.href = d.path;
        })
        .on("mouseenter", (event, d) => {
            const tagHtml = d.tags.map(t =>
                '<span class="tooltip-tag" style="background:' + tagColorMap[t.toLowerCase()] + '">' + t + '</span>'
            ).join("");
            tooltip.html(
                '<div class="tooltip-title">' + d.label + '</div>' +
                '<div class="tooltip-date"><i class="fa-solid fa-calendar"></i> ' + d.date + '</div>' +
                (d.description ? '<div class="tooltip-desc">' + d.description + '</div>' : '') +
                '<div class="tooltip-tags">' + tagHtml + '</div>'
            )
            .style("opacity", 1)
            .style("left", (event.offsetX + 15) + "px")
            .style("top", (event.offsetY - 10) + "px");

            d3.select(event.currentTarget).select("rect")
                .transition().duration(200)
                .attr("stroke-width", 3.5)
                .attr("fill", d.color + "15");

            link.attr("stroke-opacity", l =>
                l.source.id === d.id || l.target.id === d.id ? 0.8 : 0.1
            ).attr("stroke-width", l =>
                l.source.id === d.id || l.target.id === d.id ? 3 : 1.5
            );
        })
        .on("mousemove", (event) => {
            tooltip.style("left", (event.offsetX + 15) + "px")
                   .style("top", (event.offsetY - 10) + "px");
        })
        .on("mouseleave", (event, d) => {
            tooltip.style("opacity", 0);
            d3.select(event.currentTarget).select("rect")
                .transition().duration(200)
                .attr("stroke-width", 2)
                .attr("fill", "#fff");
            link.attr("stroke-opacity", 0.35).attr("stroke-width", 2);
        });

    node.filter(d => d.type === "tag")
        .on("mouseenter", (event, d) => {
            link.attr("stroke-opacity", l =>
                l.source.id === d.id || l.target.id === d.id ? 0.8 : 0.1
            ).attr("stroke-width", l =>
                l.source.id === d.id || l.target.id === d.id ? 3 : 1.5
            );
            d3.select(event.currentTarget).select("circle:nth-child(1)")
                .transition().duration(200).attr("r", 42);
        })
        .on("mouseleave", () => {
            link.attr("stroke-opacity", 0.35).attr("stroke-width", 2);
            node.filter(nd => nd.type === "tag").select("circle:nth-child(1)")
                .transition().duration(200).attr("r", 36);
        });

    simulation.on("tick", () => {
        link
            .attr("x1", d => d.source.x)
            .attr("y1", d => d.source.y)
            .attr("x2", d => d.target.x)
            .attr("y2", d => d.target.y);
        node.attr("transform", d => "translate(" + d.x + "," + d.y + ")");
    });

    function dragstarted(event, d) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
    }
    function dragged(event, d) {
        d.fx = event.x;
        d.fy = event.y;
    }
    function dragended(event, d) {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
    }

    window.addEventListener("resize", () => {
        const w = container.clientWidth;
        const h = Math.max(container.clientHeight, 600);
        svg.attr("width", w).attr("height", h);
        simulation.force("center", d3.forceCenter(w / 2, h / 2));
        simulation.alpha(0.3).restart();
    });
}
