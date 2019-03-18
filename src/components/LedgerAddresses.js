import React, { useState, useEffect } from 'react';

import { Button, Grid } from '@makerdao/ui-components-core';
import styled from 'styled-components';

import { navigation } from '../index';

import { ReactComponent as LedgerLogo } from 'images/ledger.svg';
import { mixpanelIdentify } from 'utils/analytics';
import { cutMiddle, copyToClipboard } from '../utils/ui';
import { AccountTypes } from '../utils/constants';
import { addMkrAndEthBalance } from '../utils/ethereum';

import useMaker from 'hooks/useMaker';
import useMakerState from 'hooks/useMakerState';

import {
  AddressContainer,
  Table,
  InlineTd,
  CopyBtn,
  CopyBtnIcon
} from './AddressTable';

const LEDGER_LIVE_PATH = "44'/60'/0'";
// const LEDGER_LEGACY_PATH = "44'/60'/0'/0";
const DEFAULT_ACCOUNTS_PER_PAGE = 5;

// hack to get around button padding for now
const StyledLedgerLogo = styled(LedgerLogo)`
  margin-top: -5px;
  margin-bottom: -5px;
`;

export const StyledTop = styled.div`
  display: flex;
  justify-content: center;
`;

export const StyledTitle = styled.div`
  font-weight: bold;
  color: #212536;
  line-height: 22px;
  font-size: 28px;
`;

export const StyledBlurb = styled.div`
  line-height: 22px;
  font-size: 17px;
  margin: 22px 0px 16px 0px;
`;

const onConfirm = async (maker, address) => {
  await maker.addAccount({ address, type: AccountTypes.LEDGER });
  console.log('list account', maker.listAccounts);
  maker.useAccountWithAddress(address);

  const connectedAddress = maker.currentAddress();
  console.log('connectedAddress', connectedAddress);

  mixpanelIdentify(connectedAddress, AccountTypes.LEDGER);

  const {
    network,
    address: urlParamAddress
  } = navigation.receivedRoute.url.query;

  const addressToView = urlParamAddress || connectedAddress;

  navigation.history.push({
    pathname: '/overview/',
    search: `?network=${network}&address=${addressToView}`
  });
};

const onBack = () => {};

function LedgerAddresses({ onLedgerLive, onLedgerLegacy, onCancel }) {
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState('');
  const { maker, authenticated: makerAuthenticated } = useMaker();

  const walletAddresses = useMakerState(maker =>
    maker.addAccount({
      type: AccountTypes.LEDGER,
      path: LEDGER_LIVE_PATH,
      accountsOffset: 0,
      accountsLength: DEFAULT_ACCOUNTS_PER_PAGE,
      choose: addresses => {
        const addressBalancePromises = addresses.map(address =>
          addMkrAndEthBalance({
            address,
            type: AccountTypes.LEDGER
          })
        );
        return Promise.all(addressBalancePromises).then(addressBalances =>
          setAddresses(addressBalances)
        );
      }
    })
  );

  useEffect(() => {
    walletAddresses.prefetch();
  }, []);

  return (
    <Grid gridRowGap="m">
      <StyledTop>
        <StyledTitle>Select address</StyledTitle>
      </StyledTop>
      <StyledBlurb style={{ textAlign: 'center', marginTop: '14px' }}>
        Please select which address you would like to open
      </StyledBlurb>
      <AddressContainer>
        <Table>
          <thead>
            <tr>
              <th className="radio">Select</th>
              <th>#</th>
              <th>Address</th>
              <th>ETH</th>
              <th>MKR</th>
            </tr>
          </thead>
          <tbody>
            {addresses.map(({ address, ethBalance, mkrBalance }, index) => (
              <tr key={address}>
                <td className="radio">
                  <input
                    type="radio"
                    name="address"
                    value={index}
                    checked={address === selectedAddress}
                    onChange={() => setSelectedAddress(address)}
                  />
                </td>
                <td>{index + 1}</td>

                <InlineTd title={address}>
                  {cutMiddle(address, 7, 5)}
                  <CopyBtn onClick={() => copyToClipboard(address)}>
                    <CopyBtnIcon />
                  </CopyBtn>
                </InlineTd>
                <td>{ethBalance} ETH</td>
                <td>{mkrBalance} MKR</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </AddressContainer>
      <Grid
        gridRowGap="xs"
        gridColumnGap="s"
        gridTemplateColumns={['1fr', 'auto auto']}
        justifySelf={['stretch', 'center']}
      >
        <Button variant="secondary-outline" onClick={onBack}>
          Change wallet
        </Button>
        <Button
          disabled={!selectedAddress}
          onClick={async () => onConfirm(maker, selectedAddress)}
        >
          Confirm wallet
        </Button>
      </Grid>
    </Grid>
  );
}

export default LedgerAddresses;
