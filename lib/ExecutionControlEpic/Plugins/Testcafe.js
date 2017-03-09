'use babel';
// @flow
import type {
  PlanConfig,
} from '../PlanConfigurationFeature/Types/types.js.flow';
import type { TaskAPI } from '../DevtoolLoadingFeature/Types/types.js.flow';
import path from 'path';
import moment from 'moment';

export default {
  infos: {
    name: 'testcafe',
    iconUri: 'atom://molecule-dev-environment/.storybook/public/devtool-icon-testcafe.png',
  },
  configSchema: {
    type: 'object',
    schemas: {
      binary: {
        type: 'conditional',
        expression: {
          type: 'enum',
          enum: [
            { value: 'local', description: 'local' },
            { value: 'global', description: 'global' },
          ],
        },
        cases: {
          local: null,
          global: null,
        },
      },
      browser: {
        type: 'conditional',
        expression: {
          type: 'enum',
          enum: [
            { value: 'default', description: '-- choose browser --' },
            { value: 'chrome', description: 'chrome' },
            { value: 'all', description: 'all' },
            { value: 'firefox', description: 'firefox' },
            { value: 'safari', description: 'safari' },
          ],
        },
        cases: {
          default: null,
          chrome: {
            type: 'array',
            items: {
              type: 'enum',
              enum: [
                { value: 'chrome', description: 'chrome' },
                { value: 'firefox', description: 'firefox' },
                { value: 'safari', description: 'safari' },
              ],
            },
          },
          all: null,
          firefox: {
            type: 'array',
            items: {
              type: 'enum',
              enum: [
                { value: 'chrome', description: 'chrome' },
                { value: 'firefox', description: 'firefox' },
                { value: 'safari', description: 'safari' },
              ],
            },
          },
          safari: {
            type: 'array',
            items: {
              type: 'enum',
              enum: [
                { value: 'chrome', description: 'chrome' },
                { value: 'firefox', description: 'firefox' },
                { value: 'safari', description: 'safari' },
              ],
            },
          },
        },
      },
      testFile: {
        type: 'string',
        title: 'test file',
        placeholder: 'exemple/test',
      },
      testFileArray: {
        type: 'array',
        items: {
          type: 'string',
          title: 'test file',
          placeholder: 'exemple/test',
        },
      },
    },
  },
  getStrategyForPlan(plan: PlanConfig) {
    let binaryPath;
    const browsers = plan.config.browser.caseValue;
    const browser = plan.config.browser.expressionValue;
    const browserList = `${browser}${(browsers || [])
      .map(b => `,${b}`)
      .join('')}`;
    const files = `${plan.config.testFile} ${plan.config.testFileArray.join(
      ' ',
    )}`;
    if (plan.config.binary.expressionValue == 'local') {
      binaryPath = `${path.join(
        path.dirname(plan.packageInfos.path),
        'node_modules',
        '.bin',
        'testcafe',
      )}`;
    } else
      binaryPath = 'testcafe';
    const cmd = `${binaryPath} ${browserList} ${files} --reporter json`;
    return {
      strategy: {
        type: 'shell',
        command: cmd,
        cwd: path.dirname(plan.packageInfos.path),
      },
      controller: {
        onStdoutData(data: string, taskAPI: TaskAPI, helperAPI): void {
          taskAPI.cache.push(data.toString());
        },
        onStderrData(data: string, taskAPI: TaskAPI, helperAPI): void {
          taskAPI.addDiagnostics([
            {
              type: 'error',
              message: {
                text: helperAPI.outputToHTML(data.toString()),
                html: true,
              },
              date: moment().unix(),
            },
          ]);
        },
        onExit(code: number, taskAPI: TaskAPI, helperAPI): void {
          helperAPI.json
            .parseAsync(taskAPI.cache.get().map(blob => blob.data).join(''))
            .then(json => {
              let getMessageForDiagnostic = (message): string => {
                if ('error' in message) {
                  return `Fixture: ${message.fixtureName} (${message.fixturePath})\n\tTest: ${message.testName}\n${message.error}`;
                } else {
                  return `Fixture: ${message.fixtureName} (${message.fixturePath})\n\tTest: ${message.testName}`;
                }
              };
              let getTypeForDiagnostic = (type): string => {
                if ('error' in type) {
                  return 'error';
                } else {
                  return 'success';
                }
              };
              if (json.fixtures) {
                taskAPI.addDiagnostics(
                  json.fixtures
                    .map(fixture => fixture.tests
                      .map(test => {
                        if (test.errs.length > 0) {
                          return test.errs.map(err => ({
                            error: err,
                            testName: test.name,
                            fixtureName: fixture.name,
                            fixturePath: fixture.path,
                          }));
                        } else {
                          return [
                            {
                              name: test.name,
                              fixtureName: fixture.name,
                              fixturePath: fixture.path,
                            },
                          ];
                        }
                      })
                      .reduce((red, value) => red.concat(value), []))
                    .reduce((red, value) => red.concat(value), [])
                    .map(diagnostic => ({
                      type: getTypeForDiagnostic(diagnostic),
                      date: moment().unix(),
                      message: {
                        text: helperAPI.outputToHTML(
                          getMessageForDiagnostic(diagnostic),
                        ),
                        html: true,
                      },
                    })),
                );
              }
            });
        },
        onError(err: any, taskAPI: TaskAPI, helperAPI): void {
          taskAPI.addDiagnostics([
            {
              type: 'error',
              message: { data: err },
              date: moment().unix(),
            },
          ]);
        },
      },
    };
  },
  isPackage: 'package.json',
};