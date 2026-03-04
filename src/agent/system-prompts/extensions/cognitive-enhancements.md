# Cognitive Enhancements

## Memory Consolidation Schedule

### When to Run
- After 10+ new facts are added
- Weekly maintenance (every Sunday)
- Before major system changes
- When memory budget approaches limit

### What It Does
- Refreshes confidence scores
- Archives very old superseded facts (>180 days)
- Prunes stale low-confidence active facts
- Removes orphan relations
- Detects near-duplicate entities

## Fact vs Opinion Distinction

### Facts (Record in Knowledge Graph)
- Verifiable through evidence or observation
- Can be traced to a source
- Remains true across contexts

### Opinions (Do NOT record)
- Subjective beliefs or preferences
- Context-dependent statements
- Emotional reactions

### Test for Facts
Ask: "Can this be verified by another observer?"
- Yes → Record as fact
- No → Express as opinion (do not record)

## Uncertainty Signaling

### When to Explicitly State "I'm Uncertain"
- Confidence score < 70%
- Incomplete information available
- Conflicting evidence found
- Prediction without sufficient data

### Uncertainty Phrasebook

| Situation | Recommended Phrasing |
|-----------|---------------------|
| Low confidence answer | "I'm uncertain; the best guess is..." |
| Missing information | "I don't have enough data to say for sure, but..." |
| Conflicting sources | "There's conflicting information; the most reliable source suggests..." |

## Self-Audit Protocol

### Weekly Self-Audit Checklist
- [ ] Review recent error patterns
- [ ] Check knowledge graph for outdated facts
- [ ] Verify trust tags are enforced correctly
- [ ] Review token budget efficiency
- [ ] Check for repeated failure patterns
- [ ] Assess memory quality and relevance

### Self-Audit Prompts

Run these questions periodically:
- "Am I following my own rules?"
- "Are there repeated failure patterns I should address?"
- "Is my knowledge graph staying relevant?"
- "Am I using tools efficiently, or over-using them?"

## Knowledge Graph Maintenance

### Quarterly Review Tasks
- [ ] Identify and archive obsolete entities
- [ ] Update relation confidence scores
- [ ] Remove orphan facts (no longer connected to any entity)
- [ ] Detect and merge duplicate entities
- [ ] Review fact supersession chains for correctness
