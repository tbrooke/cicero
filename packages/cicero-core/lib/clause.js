/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

const crypto = require('crypto');

/**
 * <p>
 * A Clause
 * </p>
 * @class
 * @memberof module:composer-common
 */
class Clause {

    /**
     * Create the Clause.
     * @param {Template} template  - the template for the clause
     */
    constructor(template) {
        this.template = template;
        this.data = null;
    }

    /**
     * Set the data for the clause
     * @param {object} data  - the data for the clause
     */
    setData(data) {
        // verify that data is an instance of the template model
        const templateModel = this.getTemplate().getTemplateModel();

        if (data.$class !== templateModel.getFullyQualifiedName()) {
            throw new Error(`Invalid data, must be a valid instance of the template model ${templateModel.getFullyQualifiedName()} but got: ${JSON.stringify(data)} `);
        }

        // validate the data using the template model
        console.log('Setting clause data: ' + JSON.stringify(data));
        const resource = this.template.getSerializer().fromJSON(data);
        resource.validate();

        // passed validation!
        this.data = data;
    }

    /**
     * Get the data for the clause
     * @return {object} - the data for the clause
     */
    getData() {
        return this.data;
    }

    /**
     * Set the data for the clause by parsing natural language text.
     * @param {string} text  - the data for the clause
     */
    parse(text) {
        let parser = this.getTemplate().getParser();
        parser.feed(text);
        if (parser.results.length !== 1) {
            const head = JSON.stringify(parser.results[0]);

            parser.results.forEach(function (element) {
                if (head !== JSON.stringify(element)) {
                    throw new Error('Ambigious clause text. Got ' + parser.results.length + ' ASTs for text: ' + text);
                }
            }, this);
        }
        const ast = parser.results[0];
        console.log('Result of parsing: ' + ast);

        if(!ast) {
            throw new Error('Parsing clause text returned a null AST. This may mean the text is valid, but not complete.');
        }

        this.setData(ast);
    }

    /**
     * Returns the identifier for this clause
     * @return {String} the identifier of this clause
     */
    getIdentifier() {
        let hash = '';

        if (this.data) {
            const textToHash = JSON.stringify(this.data);
            const hasher = crypto.createHash('sha256');
            hasher.update(textToHash);
            hash = '-' + hasher.digest('hex');
        }
        return this.getTemplate().getIdentifier() + hash;
    }

    /**
     * Returns the template for this clause
     * @return {Template} the template for this clause
     */
    getTemplate() {
        return this.template;
    }

    /**
     * Returns a JSON representation of the clause
     * @return {object} the JS object for serialization
     */
    toJSON() {
        return {
            template: this.getTemplate().getIdentifier(),
            data: this.getData()
        };
    }
}

module.exports = Clause;