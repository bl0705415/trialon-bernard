const ST = { AUTO: "auto", CONFIRM: "confirm", MISSING: "missing" };


export function buildTemplates(d) {
  const au = v => v && v.toString().trim() && v !== "N/A" ? ST.AUTO : ST.MISSING;
  return {
    irb:{ name:"IRB Application", icon:"📋", desc:"Needs Review", sections:[
      { id:"a1", title:"CONTACT INFO", fields:[
        { id:"t",    label:"Study Title",     status:au(d.protocol_title_full),           value:d.protocol_title_full },
        { id:"nct",  label:"Protocol Number", status:au(d.protocol_number),               value:d.protocol_number },
        { id:"pi",   label:"PI Name",         status:ST.MISSING,                          value:"" },
        { id:"sp",   label:"Product Name",    status:au(d.investigational_product_name),  value:d.investigational_product_name },
        { id:"spt",  label:"Product Type",    status:au(d.product_type),                  value:d.product_type },
        { id:"ind",  label:"IND Number",      status:au(d.ind_number),                    value:d.ind_number },
      ]},
      { id:"a2", title:"STUDY DESIGN", fields:[
        { id:"phase", label:"Phase",          status:au(d.study_phase),               value:d.study_phase },
        { id:"stype", label:"Study Type",     status:au(d.study_type),                value:d.study_type },
        { id:"alloc", label:"Randomization",  status:au(d.allocation_randomization),  value:d.allocation_randomization },
        { id:"blind", label:"Blinding",       status:au(d.blinding_masking),          value:d.blinding_masking },
        { id:"ctrl",  label:"Control Type",   status:au(d.control_type),              value:d.control_type },
      ]},
      { id:"a4", title:"STUDY DETAILS", fields:[
        { id:"obj",  label:"Primary Objective",   type:"textarea", status:au(d.primary_objective),           value:d.primary_objective },
        { id:"ep",   label:"Primary Endpoints",   type:"textarea", status:au(d.primary_endpoints),           value:d.primary_endpoints },
        { id:"sep",  label:"Secondary Endpoints", type:"textarea", status:au(d.secondary_endpoints),         value:d.secondary_endpoints },
        { id:"inc",  label:"Inclusion Criteria",  type:"textarea", status:au(d.inclusion_criteria_summary),  value:d.inclusion_criteria_summary },
        { id:"exc",  label:"Exclusion Criteria",  type:"textarea", status:au(d.exclusion_criteria_summary),  value:d.exclusion_criteria_summary },
        { id:"cond", label:"Target Condition",    status:au(d.target_condition),                             value:d.target_condition },
        { id:"age",  label:"Age Range",           status:au(d.population_age_range),                        value:d.population_age_range },
      ]},
      { id:"a5", title:"SAFETY", fields:[
        { id:"dsmb", label:"DSMB Present?",          type:"yesno",    status:au(d.dsmb_present),                         value:d.dsmb_present },
        { id:"hr",   label:"High-Risk Procedures?",  type:"yesno",    status:au(d.high_risk_procedures_flag),             value:d.high_risk_procedures_flag },
        { id:"sae",  label:"SAE Reporting Timeline", status:au(d.sae_reporting_timeline_to_sponsor),                     value:d.sae_reporting_timeline_to_sponsor },
        { id:"stop", label:"Stopping Rules",         type:"textarea", status:au(d.stopping_rules_summary),                value:d.stopping_rules_summary },
      ]},
    ]},
    consent:{ name:"Informed Consent Form", icon:"📝", desc:"Review", sections:[
      { id:"ck", title:"CONSENT DETAILS", fields:[
        { id:"ctype", label:"Consent Type",           status:au(d.consent_type),                                       value:d.consent_type },
        { id:"esig",  label:"Electronic Signature?",  type:"yesno",    status:au(d.electronic_signature_used),          value:d.electronic_signature_used },
        { id:"cid",   label:"ID Verification Method", status:au(d.identity_verification_method_for_e_consent),         value:d.identity_verification_method_for_e_consent },
        { id:"recns", label:"Re-Consent Triggers",    type:"textarea", status:au(d.reconsent_triggers_summary),         value:d.reconsent_triggers_summary },
        { id:"inc2",  label:"Inclusion Criteria",     type:"textarea", status:au(d.inclusion_criteria_summary),         value:d.inclusion_criteria_summary },
        { id:"exc2",  label:"Exclusion Criteria",     type:"textarea", status:au(d.exclusion_criteria_summary),         value:d.exclusion_criteria_summary },
      ]},
    ]},
    reliance:{ name:"IRB Reliance Agreement", icon:"🤝", desc:"Review", sections:[
      { id:"rp", title:"PROTOCOL", fields:[
        { id:"rpn",  label:"Protocol Number", status:au(d.protocol_number),       value:d.protocol_number },
        { id:"rpt",  label:"Title",           status:au(d.protocol_title_full),   value:d.protocol_title_full },
        { id:"rind", label:"IND Number",      status:au(d.ind_number),            value:d.ind_number },
        { id:"ride", label:"IDE Number",      status:au(d.ide_number),            value:d.ide_number },
      ]},
    ]},
    disclosure:{ name:"Personal Data Disclosure", icon:"🔒", desc:"Review", sections:[
      { id:"dc", title:"DATA & SPECIMENS", fields:[
        { id:"dtype", label:"Data Collected Types",    type:"textarea", status:au(d.data_collected_types),                 value:d.data_collected_types },
        { id:"dtool", label:"Digital Tools Used?",     type:"yesno",    status:au(d.digital_tools_used),                   value:d.digital_tools_used },
        { id:"dbio",  label:"Biospecimens Collected?", type:"yesno",    status:au(d.biospecimens_collected),               value:d.biospecimens_collected },
        { id:"dbank", label:"Future Use / Banking",    type:"textarea", status:au(d.future_use_banking_plan),              value:d.future_use_banking_plan },
        { id:"dgen",  label:"Genetic Testing?",        type:"yesno",    status:au(d.genetic_testing_performed),            value:d.genetic_testing_performed },
        { id:"dcomp", label:"Subject Compensation",    status:au(d.subject_compensation_amount_and_schedule),             value:d.subject_compensation_amount_and_schedule },
        { id:"dreim", label:"Subject Reimbursement",   status:au(d.subject_reimbursement_types),                          value:d.subject_reimbursement_types },
      ]},
    ]},
    checklist:{ name:"Study Planning Checklist", icon:"✅", desc:"Review", sections:[
      { id:"cs", title:"STUDY ID", fields:[
        { id:"csp2", label:"Protocol #", status:au(d.protocol_number),           value:d.protocol_number },
        { id:"cst",  label:"Title",      status:au(d.protocol_title_full),       value:d.protocol_title_full },
        { id:"csvr", label:"Version",    status:au(d.protocol_version_and_date), value:d.protocol_version_and_date },
      ]},
      { id:"cd2", title:"PROCEDURES", fields:[
        { id:"cdvst", label:"# Visits",            status:au(d.number_of_study_visits),                           value:d.number_of_study_visits },
        { id:"cdscr", label:"Screening Window",    status:au(d.screening_window_days),                            value:d.screening_window_days },
        { id:"cdprc", label:"Key Procedures",      type:"textarea", status:au(d.key_procedures_high_level),       value:d.key_procedures_high_level },
        { id:"cdimg", label:"Imaging",             status:au(d.imaging_procedures),                               value:d.imaging_procedures },
        { id:"cdinv", label:"Invasive Procedures", status:au(d.invasive_procedures),                              value:d.invasive_procedures },
        { id:"cdrug", label:"Dose Regimen",        status:au(d.dose_regimen),                                     value:d.dose_regimen },
        { id:"cdrte", label:"Route of Admin",      status:au(d.route_of_administration),                          value:d.route_of_administration },
      ]},
    ]},
  };
}

export function buildClauses(d) {
  const product = d.investigational_product_name || "[Product]";
  const conds   = d.target_condition || "[condition]";
  return [
    { id:"ind",    title:"Indemnification",      cat:"high-risk",   basis:`${d.study_type||"Study"} — ${conds}`,         text:`Sponsor shall indemnify Institution from claims arising from ${product} use, Sponsor breach, or Sponsor negligence.`, status:"pending" },
    { id:"inj",    title:"Subject Injury",        cat:"high-risk",   basis:`Involves ${d.product_type||"product"}`,       text:`Sponsor pays medical expenses for study-related injuries not covered by Subject's insurance.`, status:"pending" },
    { id:"ip",     title:"Intellectual Property", cat:"medium-risk", basis:`Protocol v${d.protocol_version_and_date||"TBD"}`, text:`${product} IP remains with Sponsor. Institution retains independent inventions.`, status:"pending" },
    { id:"pub",    title:"Publication",           cat:"medium-risk", basis:"Protocol Agreement",                          text:`Institution may publish after 60-day review. No suppression.`, status:"pending" },
    { id:"confid", title:"Confidentiality",       cat:"standard",    basis:"Protocol materials",                          text:`Five-year confidentiality. Standard carve-outs apply.`, status:"pending" },
    { id:"term",   title:"Termination",           cat:"standard",    basis:`Version: ${d.protocol_version_and_date||"TBD"}`, text:`30 days notice. Sponsor pays for completed work.`, status:"pending" },
  ];
}