export function ParseState(jsonData) {
    const nodes = [];
    const edges = [];

    // Add nodes
    for (const assetId in jsonData.state.assets) {
        const asset = jsonData.state.assets[assetId];
        const nodeId = assetId;
        const nodeName = asset.properties.Name;
        const nodeType = asset.properties.Type[0]
        const nodeStatus = asset.plugins?.netscan?.status

        nodes.push({
            id: nodeId,
            data: { label: nodeName, type: nodeType, status: nodeStatus },
            position: { x: 0, y: 0 }, // Assuming initial position
            type: 'turbo'
        });
    }

    // Add edges
    for (const relationId in jsonData.state.relations) {
        const relation = jsonData.state.relations[relationId];
        const edgeId = relationId;
        const sourceNode = relation.from;
        const targetNode = relation.to;
        const directional = relation.direction === "uni" ? true : false;
        edges.push({
            id: edgeId,
            source: sourceNode,
            target: targetNode,
            // type: 'smoothstep',
            type: 'turbo',
            animated: directional,
        });
    }
    return { nodes, edges };
}
