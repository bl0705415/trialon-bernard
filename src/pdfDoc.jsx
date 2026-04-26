import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet
} from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    padding: 36,
    fontSize: 11,
    lineHeight: 1.5,
    fontFamily: "Helvetica",
  },
  title: {
    fontSize: 18,
    marginBottom: 12,
    fontWeight: 700,
  },
  subtitle: {
    fontSize: 13,
    marginBottom: 10,
    fontWeight: 700,
  },
  section: {
    marginBottom: 14,
    paddingBottom: 8,
    borderBottom: "1 solid #d1d5db",
  },
  row: {
    marginBottom: 6,
  },
  label: {
    fontSize: 10,
    color: "#4b5563",
    marginBottom: 2,
  },
  value: {
    fontSize: 11,
  },
  clauseBox: {
    marginBottom: 10,
    padding: 8,
    border: "1 solid #d1d5db",
  }
});

const safe = (v) => (v && `${v}`.trim() ? `${v}` : "Not provided");

const FieldRow = ({ label, value }) => (
  <View style={styles.row}>
    <Text style={styles.label}>{label}</Text>
    <Text style={styles.value}>{safe(value)}</Text>
  </View>
);

export const IRBApplicationPDF = ({ data = {} }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <Text style={styles.title}>IRB Application</Text>

      <View style={styles.section}>
        <Text style={styles.subtitle}>Study Identification</Text>
        <FieldRow label="Protocol Title" value={data.protocol_title_full} />
        <FieldRow label="Short Title" value={data.protocol_short_title} />
        <FieldRow label="Protocol Number" value={data.protocol_number} />
        <FieldRow label="Protocol Version & Date" value={data.protocol_version_and_date} />
        <FieldRow label="IND Number" value={data.ind_number} />
        <FieldRow label="IDE Number" value={data.ide_number} />
      </View>

      <View style={styles.section}>
        <Text style={styles.subtitle}>Study Design</Text>
        <FieldRow label="Phase" value={data.study_phase} />
        <FieldRow label="Study Type" value={data.study_type} />
        <FieldRow label="Allocation / Randomization" value={data.allocation_randomization} />
        <FieldRow label="Blinding / Masking" value={data.blinding_masking} />
        <FieldRow label="Control Type" value={data.control_type} />
        <FieldRow label="Primary Objective" value={data.primary_objective} />
        <FieldRow label="Primary Endpoint(s)" value={data.primary_endpoints} />
        <FieldRow label="Secondary Endpoint(s)" value={data.secondary_endpoints} />
      </View>

      <View style={styles.section}>
        <Text style={styles.subtitle}>Population</Text>
        <FieldRow label="Target Condition" value={data.target_condition} />
        <FieldRow label="Age Range" value={data.population_age_range} />
        <FieldRow label="Inclusion Criteria" value={data.inclusion_criteria_summary} />
        <FieldRow label="Exclusion Criteria" value={data.exclusion_criteria_summary} />
        <FieldRow label="Vulnerable Populations Included?" value={data.vulnerable_populations_included} />
      </View>

      <View style={styles.section}>
        <Text style={styles.subtitle}>Risk / Safety</Text>
        <FieldRow label="High-Risk Procedures?" value={data.high_risk_procedures_flag} />
        <FieldRow label="Data Monitoring Plan Present?" value={data.data_monitoring_plan_present} />
        <FieldRow label="DSMB Established?" value={data.dsmb_present} />
        <FieldRow label="DSMB Review Frequency" value={data.dsmb_review_frequency} />
        <FieldRow label="Stopping Rules" value={data.stopping_rules_summary} />
        <FieldRow label="SAE Reporting Timeline" value={data.sae_reporting_timeline_to_sponsor} />
      </View>
    </Page>
  </Document>
);

export const ConsentFormPDF = ({ data = {} }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <Text style={styles.title}>Informed Consent Form</Text>

      <View style={styles.section}>
        <Text style={styles.subtitle}>Study Information</Text>
        <FieldRow label="Study Title" value={data.protocol_title_full} />
        <FieldRow label="Protocol Number" value={data.protocol_number} />
        <FieldRow label="Condition Being Studied" value={data.target_condition} />
        <FieldRow label="Investigational Product" value={data.investigational_product_name} />
        <FieldRow label="Product Type" value={data.product_type} />
      </View>

      <View style={styles.section}>
        <Text style={styles.subtitle}>Why am I being asked to join?</Text>
        <FieldRow label="Target Age Range" value={data.population_age_range} />
        <FieldRow label="Key Inclusion Criteria" value={data.inclusion_criteria_summary} />
        <FieldRow label="Key Exclusion Criteria" value={data.exclusion_criteria_summary} />
      </View>

      <View style={styles.section}>
        <Text style={styles.subtitle}>What will happen in the study?</Text>
        <FieldRow label="Number of Study Visits" value={data.number_of_study_visits} />
        <FieldRow label="Screening Window (days)" value={data.screening_window_days} />
        <FieldRow label="Key Procedures by Visit" value={data.key_procedures_high_level} />
        <FieldRow label="Imaging Procedures" value={data.imaging_procedures} />
        <FieldRow label="Invasive Procedures" value={data.invasive_procedures} />
      </View>

      <View style={styles.section}>
        <Text style={styles.subtitle}>Risks and Safety</Text>
        <FieldRow label="High-Risk Procedures?" value={data.high_risk_procedures_flag} />
        <FieldRow label="Stopping Rules / Early Termination Criteria" value={data.stopping_rules_summary} />
      </View>

      <View style={styles.section}>
        <Text style={styles.subtitle}>Compensation and Privacy</Text>
        <FieldRow label="Compensation Amount / Schedule" value={data.subject_compensation_amount_and_schedule} />
        <FieldRow label="Reimbursement Types" value={data.subject_reimbursement_types} />
        <FieldRow label="Data Collected Types" value={data.data_collected_types} />
        <FieldRow label="Digital Tools Used?" value={data.digital_tools_used} />
        <FieldRow label="Biospecimens Collected?" value={data.biospecimens_collected} />
        <FieldRow label="Genetic Testing Performed?" value={data.genetic_testing_performed} />
      </View>
    </Page>
  </Document>
);

export const ClinicalTrialAgreementPDF = ({ data = {}, clauses = [] }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <Text style={styles.title}>Draft Clinical Trial Agreement</Text>

      <View style={styles.section}>
        <Text style={styles.subtitle}>Agreement Summary</Text>
        <FieldRow label="Study Title" value={data.protocol_title_full} />
        <FieldRow label="Protocol Number" value={data.protocol_number} />
        <FieldRow label="Protocol Version & Date" value={data.protocol_version_and_date} />
        <FieldRow label="Investigational Product" value={data.investigational_product_name} />
        <FieldRow label="Condition" value={data.target_condition} />
        <FieldRow label="Study Type" value={data.study_type} />
      </View>

      <View style={styles.section}>
        <Text style={styles.subtitle}>Proposed Clauses</Text>

        {clauses.length ? (
          clauses.map((clause) => (
            <View key={clause.id} style={styles.clauseBox} wrap={false}>
              <Text style={{ fontSize: 12, marginBottom: 4, fontWeight: 700 }}>
                {safe(clause.title)}
              </Text>
              <Text style={{ fontSize: 10, marginBottom: 4 }}>
                Category: {safe(clause.cat)}
              </Text>
              <Text style={{ fontSize: 10, marginBottom: 4 }}>
                Basis: {safe(clause.basis)}
              </Text>
              <Text style={{ fontSize: 11 }}>
                {safe(clause.text)}
              </Text>
            </View>
          ))
        ) : (
          <Text style={styles.value}>No clauses available.</Text>
        )}
      </View>
    </Page>
  </Document>
);