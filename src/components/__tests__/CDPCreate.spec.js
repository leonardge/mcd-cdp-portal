import React from 'react';
import { ETH } from '@makerdao/dai-plugin-mcd';
import { createCurrency } from '@makerdao/currency';
import CDPCreate from '../CDPCreate';
import { renderWithAccount, mocks } from '../../../test/helpers/render';
import { wait, fireEvent } from '@testing-library/react';
import { instantiateMaker } from '../../maker';
import BigNumber from 'bignumber.js';
import { mineBlocks } from '@makerdao/test-helpers';
import assert from 'assert';
import { of } from 'rxjs';
import useMaker from '../../hooks/useMaker';
const { click, change } = fireEvent;

jest.mock('mixpanel-browser', () => ({
  init: jest.fn(),
  track: jest.fn()
}));

jest.mock('react-navi', () => ({
  useCurrentRoute: () => ({ url: { pathname: '/borrow' } })
}));

let maker;

beforeAll(async () => {
  maker = await instantiateMaker({ network: 'testnet' });
});

function prepState(state) {
  Object.assign(state.feeds.find(f => f.key === 'ETH-A'), {
    liquidationRatio: '150',
    debtCeiling: '1000000',
    feedValueUSD: BigNumber(200)
  });
  return {
    ...state,
    accounts: {
      [maker.currentAddress()]: {
        balances: { ETH: 3 },
        allowances: {}
      }
    }
  };
}

const watchMock = services => (key, ...args) =>
  services[key] && services[key](...args);

const tokenBalanceMock = (address, token) => {
  if (token === 'ETH') return of(ETH(3));
  else return of(createCurrency(token)(0));
};

test('the whole flow', async () => {
  const {
    getAllByRole,
    getAllByText,
    getByLabelText,
    getByText
  } = await renderWithAccount(
    React.createElement(() => {
      maker = useMaker().maker;

      maker.service('multicall').watch = watchMock({
        tokenBalance: tokenBalanceMock
      });
      return <CDPCreate />;
    }),
    prepState
  );

  getByText('Select a collateral type');
  const [ethRadioButton] = getAllByRole('radio'); // ETH-A is the first ilk
  click(ethRadioButton);
  click(getByText('Continue'));

  getByText('Vault Setup and Management');
  // this assumes the user already has proxy and allowances set up
  await wait(() => assert(getAllByText('checkmark.svg').length === 2));
  click(getByText('Continue'));

  getByText('Deposit ETH and Generate Dai');
  change(getByLabelText('ETH'), { target: { value: '2.12845673' } });
  change(getByLabelText('DAI'), { target: { value: '31.11911157' } });
  const continueButton = getByText('Continue');
  await wait(() => assert(!continueButton.disabled));
  click(continueButton);

  getByText('Confirm Vault Details');
  getByText('2.128 ETH');
  getByText('31.119 DAI');
  getByText('1367.94%'); // collateralization ratio
  getAllByRole('checkbox').forEach(click); // terms & privacy
  const openButton = getByText('Open Vault');
  await wait(() => assert(!openButton.disabled));
  click(openButton);

  await wait(() => getByText('Your Vault is being created'));
  await mineBlocks(maker.service('web3'), 5);
  await wait(() => getByText('Your Vault has been created'));

  // expect to be redirected to the new cdp page
  // expect(mocks.navigation.navigate).toBeCalled();
}, 15000);
