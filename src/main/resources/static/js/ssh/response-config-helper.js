// response-config-helper.js
class ResponseConfigHelper {
    constructor(ui) {
        this.ui = ui;
        this.examples = {
            json: {
                simple: `{
                            "statusCode": ${"$"}{statusCode},
                            "message": "${"$"}{message}",
                            "timestamp": "${"$"}{timestamp}",
                            "success": ${"$"}{success}
                        }`,
                nested: `{
                            "statusCode": ${"$"}{statusCode},
                            "message": "${"$"}{message}",
                            "data": {
                                "userId": ${"$"}{userId},
                                "username": "${"$"}{username}",
                                "email": "${"$"}{email}",
                                "phoneNumber": "${"$"}{phoneNumber}",
                                "role": "${"$"}{role}",
                                "status": "${"$"}{status}",
                                "createdAt": "${"$"}{createdAt}"
                            }
                        }`,
                array: `{
                            "statusCode": ${"$"}{statusCode},
                            "message": "${"$"}{message}",
                            "data": {
                                "users": ${"$"}{users},
                                "total": ${"$"}{total},
                                "page": ${"$"}{page}
                            }
                        }`
            },
            xml: {
                simple: `<?xml version="1.0" encoding="UTF-8"?>
                        <response>
                            <statusCode>${"$"}{statusCode}</statusCode>
                            <message>${"$"}{message}</message>
                            <timestamp>${"$"}{timestamp}</timestamp>
                            <success>${"$"}{success}</success>
                        </response>`,
                nested: `<?xml version="1.0" encoding="UTF-8"?>
                        <response>
                            <statusCode>${"$"}{statusCode}</statusCode>
                            <message>${"$"}{message}</message>
                            <data>
                                <userId>${"$"}{userId}</userId>
                                <username>${"$"}{username}</username>
                                <email>${"$"}{email}</email>
                                <phoneNumber>${"$"}{phoneNumber}</phoneNumber>
                                <role>${"$"}{role}</role>
                                <status>${"$"}{status}</status>
                                <createdAt>${"$"}{createdAt}</createdAt>
                            </data>
                        </response>`
            }
        };
    }

    async copyToClipboard(text, successMessage = 'Contoh berhasil disalin!') {
        try {
            await navigator.clipboard.writeText(text);
            this.ui.showMessage(successMessage, false);
        } catch (err) {
            // Fallback untuk browser lama
            const textarea = document.createElement('textarea');
            textarea.value = text;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            this.ui.showMessage(successMessage, false);
        }
    }

    copyJsonExample() {
        this.copyToClipboard(this.examples.json.nested, 'Contoh JSON berhasil disalin!');
    }

    copyXmlExample() {
        this.copyToClipboard(this.examples.xml.nested, 'Contoh XML berhasil disalin!');
    }

    getJsonExamples() {
        return this.examples.json;
    }

    getXmlExamples() {
        return this.examples.xml;
    }

    async handleTestTemplate() {
        const formData = this.ui.getFormData();
        
        if (!formData.template) {
            this.ui.showMessage('Template tidak boleh kosong', true);
            return;
        }

        const sampleDataInput = document.getElementById('sampleDataInput');
        const outputEl = document.getElementById('generatedResponseOutput');

        let sampleData = {};
        try {
            if (sampleDataInput.value) {
                sampleData = JSON.parse(sampleDataInput.value);
            }
        } catch (error) {
            this.ui.showMessage('Format sample data JSON tidak valid', true);
            return;
        }

        try {
            const result = await window.responseConfigManager.testTemplate(
                formData.format, 
                formData.template, 
                sampleData
            );
            
            if (result.success) {
                outputEl.textContent = result.generatedResponse;
                if (formData.format === 'JSON') {
                    try {
                        const parsed = JSON.parse(result.generatedResponse);
                        outputEl.textContent = JSON.stringify(parsed, null, 2);
                    } catch (e) {
                        // Not valid JSON, keep as is
                    }
                }
            } else {
                outputEl.textContent = `Error: ${result.error}`;
            }
        } catch (error) {
            outputEl.textContent = `Error: ${error.message}`;
            this.ui.showMessage(error.message, true);
        }
    }
}