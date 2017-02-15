'use babel'
// @flow

import React from 'react';
import Plan from "./Plan";
import type {PlanConfig} from "../Types/types.js.flow";
import type {TaskState} from "../../TaskExecutionFeature/Types/types.js.flow";

export default class Plans extends React.Component<DefaultProps, Props, State> {

  state: State;
  props: Props;
  static defaultProps: DefaultProps;

  constructor(props: Props) {
    super(props);
  }

  render() {
    return (
      <ul style={{paddingLeft: '0', margin: '5px', display: 'flex'}}>
        {this.props.plans.map(plan => (
          <li key={plan.tool.id + ' ' + plan.name} style={{listStyle: 'none', margin: '0px 3px'}}>
            <Plan
              iconUri={plan.tool.iconUri}
              name={plan.name}
              pinnable={this.props.pinnable}
              state={plan.state}
              onClick={() => this.props.onPlanClick(plan)}
              onPin={() => this.props.onPlanPin(plan)}
            />
          </li>
        ))}
      </ul>
    )
  }
}

Plans.propTypes = {

};

Plans.defaultProps = {
  pinnable: false
};

type DefaultProps = {
  pinnable: false
};

type Props = {
  plans: Array<PlanConfig & {state: TaskState}>,
  pinnable: boolean,
  onPlanClick(plan: PlanConfig): void,
  onPlanPin(targer: PlanConfig): void,
};

type State = {

};