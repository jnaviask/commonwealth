/* @jsx jsx */

import { ClassComponent, ResultNode, render, setRoute, getRoute, getRouteParam, redraw, Component, jsx } from 'mithrilInterop';
import { utils } from 'ethers';

import 'pages/new_proposal/aave_proposal_form.scss';

import app from 'state';
import { Executor } from 'common-common/src/eth/types';
import User from 'views/components/widgets/user';
import { AaveProposalArgs } from 'controllers/chain/ethereum/aave/governance';
import { notifyError } from 'controllers/app/notifications';
import Aave from 'controllers/chain/ethereum/aave/adapter';
import { CWTab, CWTabBar } from '../../components/component_kit/cw_tabs';
import { CWLabel } from '../../components/component_kit/cw_label';
import { CWTextInput } from '../../components/component_kit/cw_text_input';
import { CWPopoverMenu } from '../../components/component_kit/cw_popover/cw_popover_menu';
import { CWIconButton } from '../../components/component_kit/cw_icon_button';
import { CWText } from '../../components/component_kit/cw_text';
import { CWCheckbox } from '../../components/component_kit/cw_checkbox';
import { AaveProposalState, defaultStateItem } from './types';
import { CWButton } from '../../components/component_kit/cw_button';

export class AaveProposalForm extends ClassComponent {
  private aaveProposalState: Array<AaveProposalState>;
  private activeTabIndex: number;
  private executor: Executor | string;
  private ipfsHash: string;
  private proposer: string;
  private tabCount: number;

  oninit() {
    this.aaveProposalState = [defaultStateItem];
    this.activeTabIndex = 0;
    this.tabCount = 1;
  }

  view() {
    const author = app.user.activeAccount;
    const aave = app.chain as Aave;
    const { activeTabIndex, aaveProposalState } = this;

    return (
      <div className="AaveProposalForm">
        <div className="row-with-label">
          <CWLabel label="Proposer (you)" />
          {render(User, {
            user: author,
            linkify: true,
            popover: true,
            showAddressWithDisplayName: true,
          })}
        </div>
        <CWTextInput
          label="IPFS Hash"
          placeholder="Proposal IPFS Hash"
          oninput={(e) => {
            this.ipfsHash = e.target.value;
          }}
        />
        <div className="row-with-label">
          <CWLabel label="Executor" />
          <div className="executors-container">
            {aave.governance.api.Executors.map((r) => (
              <div
                className={`executor ${
                  this.executor === r.address && 'selected-executor'
                }`}
                onClick={() => {
                  this.executor = r.address;
                }}
              >
                <div className="executor-row">
                  <CWText fontWeight="medium">Address</CWText>
                  <CWText type="caption" noWrap>
                    {r.address}
                  </CWText>
                </div>
                <div className="executor-row">
                  <CWText fontWeight="medium">Time Delay</CWText>
                  <CWText type="caption">
                    {r.delay / (60 * 60 * 24)} Day(s)
                  </CWText>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="tab-selector">
          <CWTabBar>
            {aaveProposalState.map((_, index) => (
              <CWTab
                label={`Call ${index + 1}`}
                isSelected={activeTabIndex === index}
                onClick={() => {
                  this.activeTabIndex = index;
                }}
              />
            ))}
          </CWTabBar>
          <CWPopoverMenu
            menuItems={[
              {
                iconLeft: 'write',
                label: 'Add',
                onClick: () => {
                  this.tabCount++;
                  this.activeTabIndex = this.tabCount - 1;
                  this.aaveProposalState.push(defaultStateItem);
                },
              },
              {
                iconLeft: 'trash',
                label: 'Delete',
                disabled: this.activeTabIndex === 0,
                onClick: () => {
                  this.tabCount--;
                  this.activeTabIndex = this.tabCount - 1;
                  this.aaveProposalState.pop();
                },
              },
            ]}
            trigger={<CWIconButton iconName="plus" />}
          />
        </div>
        <CWTextInput
          label="Target Address"
          placeholder="Add Target"
          value={aaveProposalState[activeTabIndex].target}
          oninput={(e) => {
            this.aaveProposalState[activeTabIndex].target = e.target.value;
          }}
        />
        <CWTextInput
          label="Value"
          placeholder="Enter amount in wei"
          value={aaveProposalState[activeTabIndex].value}
          oninput={(e) => {
            this.aaveProposalState[activeTabIndex].value = e.target.value;
          }}
        />
        <CWTextInput
          label="Calldata"
          placeholder="Add Calldata"
          value={aaveProposalState[activeTabIndex].calldata}
          oninput={(e) => {
            this.aaveProposalState[activeTabIndex].calldata = e.target.value;
          }}
        />
        <CWTextInput
          label="Function Signature (Optional)"
          placeholder="Add a signature"
          value={aaveProposalState[activeTabIndex].signature}
          oninput={(e) => {
            this.aaveProposalState[activeTabIndex].signature = e.target.value;
          }}
        />
        <CWCheckbox
          checked={this.aaveProposalState[activeTabIndex].withDelegateCall}
          onchange={() => {
            this.aaveProposalState[activeTabIndex].withDelegateCall =
              !this.aaveProposalState[activeTabIndex].withDelegateCall;
          }}
          label="Delegate Call"
          value=""
        />
        <CWButton
          label="Send transaction"
          onClick={(e) => {
            e.preventDefault();

            this.proposer = app.user?.activeAccount?.address;

            if (!this.proposer) {
              throw new Error('Invalid address / not logged in');
            }

            if (!this.executor) {
              throw new Error('Invalid executor');
            }

            if (!this.ipfsHash) {
              throw new Error('No ipfs hash');
            }

            const targets = [];
            const values = [];
            const calldatas = [];
            const signatures = [];
            const withDelegateCalls = [];

            for (let i = 0; i < this.tabCount; i++) {
              const aaveProposal = this.aaveProposalState[i];

              if (aaveProposal.target) {
                targets.push(aaveProposal.target);
              } else {
                throw new Error(`No target for Call ${i + 1}`);
              }

              values.push(aaveProposal.value || '0');
              calldatas.push(aaveProposal.calldata || '');
              withDelegateCalls.push(aaveProposal.withDelegateCall || false);
              signatures.push(aaveProposal.signature || '');
            }

            // TODO: preload this ipfs value to ensure it's correct
            const ipfsHash = utils.formatBytes32String(this.ipfsHash);

            const details: AaveProposalArgs = {
              executor: this.executor as string,
              targets,
              values,
              calldatas,
              signatures,
              withDelegateCalls,
              ipfsHash,
            };

            aave.governance
              .propose(details)
              .then(() => redraw())
              .catch((err) => notifyError(err.data?.message || err.message));
          }}
        />
      </div>
    );
  }
}