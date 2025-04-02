const { TemplateArchiveProcessor } = require('@accordproject/template-engine');
const { Template } = require('@accordproject/cicero-core');

const TEMPLATE_PATH = './archives/latedeliveryandpenalty-typescript';

async function trigger() {
    const template = await Template.fromDirectory(TEMPLATE_PATH);
    const templateArchiveProcessor = new TemplateArchiveProcessor(template);
    const data = {
        "$class": "io.clause.latedeliveryandpenalty@0.1.0.TemplateModel",
        "forceMajeure": true,
        "penaltyDuration": {
            "$class": "org.accordproject.time@0.3.0.Duration",
            "amount": 2,
            "unit": "days"
        },
        "penaltyPercentage": 10.5,
        "capPercentage": 55,
        "termination": {
            "$class": "org.accordproject.time@0.3.0.Duration",
            "amount": 15,
            "unit": "days"
        },
        "fractionalPart": "days",
        "clauseId": "c88e5ed7-c3e0-4249-a99c-ce9278684ac8",
        "$identifier": "c88e5ed7-c3e0-4249-a99c-ce9278684ac8"
    };
    const request = {
        goodsValue: 100
    };
    const response = await templateArchiveProcessor.trigger(data, request);
    console.log('\nTrigger response:');
    console.log(JSON.stringify(response, null, 2));
}

async function draft() {
    const template = await Template.fromDirectory(TEMPLATE_PATH);
    const templateArchiveProcessor = new TemplateArchiveProcessor(template);
    const data = {
        "$class": "io.clause.latedeliveryandpenalty@0.1.0.TemplateModel",
        "forceMajeure": true,
        "penaltyDuration": {
            "$class": "org.accordproject.time@0.3.0.Duration",
            "amount": 2,
            "unit": "days"
        },
        "penaltyPercentage": 10.5,
        "capPercentage": 55,
        "termination": {
            "$class": "org.accordproject.time@0.3.0.Duration",
            "amount": 15,
            "unit": "days"
        },
        "fractionalPart": "days",
        "clauseId": "c88e5ed7-c3e0-4249-a99c-ce9278684ac8",
        "$identifier": "c88e5ed7-c3e0-4249-a99c-ce9278684ac8"
    };
    const options = {verbose: false};
    const result = await templateArchiveProcessor.draft(data, 'markdown', options);
    console.log('\Contract draft:');
    console.log(result);
}

draft();
trigger();
