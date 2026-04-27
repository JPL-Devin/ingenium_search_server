describe('mapping-config', () => {
  const mappingConfig = require('../../../src/config/mapping-config');

  test('should export a mappings object', () => {
    expect(mappingConfig).toHaveProperty('mappings');
    expect(mappingConfig.mappings).toHaveProperty('properties');
    expect(mappingConfig.mappings).toHaveProperty('dynamic_templates');
  });

  test('should define execution_user_input properties', () => {
    const props = mappingConfig.mappings.properties.execution_user_input.properties;
    expect(props.reference_procedure_version.type).toBe('long');
    expect(props.duration.type).toBe('long');
    expect(props.timeout.type).toBe('long');
    expect(props.lookback.type).toBe('long');
  });

  test('should define authoring_user_input properties', () => {
    const props = mappingConfig.mappings.properties.authoring_user_input.properties;
    expect(props.reference_procedure_version.type).toBe('long');
    expect(props.timeout.type).toBe('long');
    expect(props.lookback.type).toBe('long');
  });

  test('should define execution date fields with strict_date_optional_time format', () => {
    const meta = mappingConfig.mappings.properties.execution.properties.meta_data.properties;
    expect(meta.time_started.type).toBe('date');
    expect(meta.time_started.format).toBe('strict_date_optional_time');
    expect(meta.time_updated.type).toBe('date');
    expect(meta.time_completed.type).toBe('date');
  });

  test('should define procedureDetails date fields', () => {
    const props = mappingConfig.mappings.properties.procedureDetails.properties;
    expect(props.time_created.type).toBe('date');
    expect(props.time_saved.type).toBe('date');
  });

  test('should define procedureVersionDetails with version and dates', () => {
    const props = mappingConfig.mappings.properties.procedureVersionDetails.properties;
    expect(props.version.type).toBe('long');
    expect(props.time_saved.type).toBe('date');
    expect(props.time_versioned.type).toBe('date');
  });

  test('should define executionDetails date fields and transitions', () => {
    const props = mappingConfig.mappings.properties.executionDetails.properties;
    expect(props.time_completed.type).toBe('date');
    expect(props.time_started.type).toBe('date');
    expect(props.transitions.properties.time_updated.type).toBe('date');
  });

  test('should define venueDetails with venue_status started_on', () => {
    const props = mappingConfig.mappings.properties.venueDetails.properties;
    expect(props.venue_status.properties.started_on.type).toBe('date');
  });

  test('should have a dynamic_templates mapping strings to wildcard', () => {
    const templates = mappingConfig.mappings.dynamic_templates;
    expect(templates).toHaveLength(1);
    expect(templates[0].string_as_wildcard.match_mapping_type).toBe('string');
    expect(templates[0].string_as_wildcard.mapping.type).toBe('wildcard');
  });
});
