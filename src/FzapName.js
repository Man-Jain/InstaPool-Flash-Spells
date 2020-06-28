import React from "react";
import "./FzapName.css";
import {
  deployContract,
  executeOperation,
  withdraw,
} from "./services/Web3Services";
import { getWeb3Instance } from "./services/index";
import * as Web3 from "web3";
import {
  CardBody,
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  Form,
  FormInput,
  FormGroup,
  Container,
  Row,
  Col,
  Button,
  Nav,
  NavItem,
  NavLink,
} from "shards-react";
import {
  faThumbsDown,
  faThumbsUp,
  faHandPointer,
  faDollarSign,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  getspell,
  defaultAddress,
  getProfile,
  setProfiles,
  updateProfiles,
} from "./services";
import * as BigNumber from "bignumber.js";
import makeBlockie from "ethereum-blockies-base64";
import { getShortAddress } from "./services/utils";
import GridLoader from "react-spinners/GridLoader";
import BounceLoader from "react-spinners/BounceLoader";
import TransactionModal from "./Modal";
import TransactionSpinner from "./TransactionSpinner";

export default class FZapName extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      asset: "",
      currentspellID: "",
      currentspell: null,
      parametersInput: [],
      currentTab: "Summary",
      contract: "",
      open: false,
      currentStatus: null,
      modalContent: "",
      deployTransactionHash: null,
      deployTransactionStatus: null,
      withdrawTransactionHash: null,
      withdrawTransactionStatus: null,
      executeTransactionStatus: null,
      executeTransactionHash: null,
    };

    this.executespell = this.executespell.bind(this);
    this.withdrawAsset = this.withdrawAsset.bind(this);
    this.deploy = this.deploy.bind(this);
    this.toggle = this.toggle.bind(this);
  }

  toggle = () => {
    this.setState({
      open: !this.state.open,
    });
  };

  async componentDidMount() {
    const spellID = this.props.match.params.spellUUID;
    console.log(spellID, "spellID");

    const spell = await getspell(spellID);

    console.log("curent siwft", spellID);
    console.log("propsthis", this.props);
    console.log(spell.contractByteCode);

    this.setState({ currentspell: spell, currentspellID: spellID });
  }

  executespell = async () => {
    var args = [];
    this.state.currentspell.parameters.map(async (param) => {
      if (param.paramType === "AssetAmount") {
        const amt = new BigNumber(
          new BigNumber(this.state[param.paramName]) * new BigNumber(10 ** 18)
        );
        console.log("amount", amt);
        args.push(amt);
      } else {
        args.push(this.state[param.paramName]);
      }
    });

    console.log(args);

    const web3 = await getWeb3Instance();

    // var amt = "1";
    // var args = [
    //   "0xf80A32A835F79D7787E8a8ee5721D0fEaFd78108",
    //   web3.utils.toWei(amt, "ether"),
    // ];

    const spellID = this.props.match.params.spellUUID;
    console.log(spellID, "spellID");
    const spell = await getspell(spellID);
    const contractAddress = this.props.location.state
      ? this.props.location.state.contractAddress
      : this.state.contract;
    const executeInstance = await executeOperation(
      contractAddress,
      spell.contractABI,
      args
    );

    executeInstance.methods
      .flashloanWrapper(...args)
      .send(
        {
          from: await defaultAddress(),
          gas: web3.utils.toHex(2220000),
          gasPrice: web3.utils.toHex(web3.utils.toWei("100", "gwei")),
        },
        (err, txh) => {
          console.log(txh, err);
        }
      )
      .on("error", (error) => {
        console.log("error", error);
        this.setState({ executeTransactionStatus: "failed" });
      })
      .on("transactionHash", (executeTransactionHash) => {
        this.setState({ executeTransactionHash: executeTransactionHash });
        console.log(executeTransactionHash);
      })
      .then((newContractInstance) => {
        this.setState({ executeTransactionStatus: "done" });
      });
  };

  deploy = async () => {
    const web3 = await getWeb3Instance();
    this.setState({ deployTransactionStatus: "inProgress" });
    const spellID = this.props.match.params.spellUUID;
    console.log(spellID, "spellID");
    const spell = await getspell(spellID);
    var deployContractInstance = await deployContract(
      spell.contractByteCode,
      spell.contractABI
    );

    let contract;

    let parameter = {
      from: await defaultAddress(),
      gas: web3.utils.toHex(2220000),
      gasPrice: web3.utils.toHex(web3.utils.toWei("30", "gwei")),
    };

    await deployContractInstance
      .deploy({
        from: await defaultAddress(),
        data: "0x" + spell.contractByteCode,
        arguments: [
          "0x1c8756FD2B28e9426CDBDcC7E3c4d64fa9A54728",
          "0x2Ee331840018465bD7Fe74aA4E442b9EA407fBBE",
          "0x2Ee331840018465bD7Fe74aA4E442b9EA407fBBE",
        ],
      })
      .send(parameter, (err, result) => {
        console.log(err, result);
      })
      .on("error", (error) => {
        console.log("error", error);
        this.setState({ deployTransactionStatus: "failed" });
      })
      .on("transactionHash", (deployTransactionHash) => {
        this.setState({ deployTransactionHash: deployTransactionHash });
        console.log(deployTransactionHash);
      })
      .then((newContractInstance) => {
        contract = newContractInstance.options.address;
        console.log(newContractInstance.options.address); // instance with the new contract address
        this.setState({ contract, deployTransactionStatus: "done" });
      });
    console.log("deployed", contract);

    const userAddress = await defaultAddress();
    let userProfile = await getProfile(userAddress);

    if (!userProfile) {
      const newUserProfile = {
        address: userAddress,
        totalUpVotes: 0,
        totalDownVotes: 0,
        totalspellsCreated: 1,
        userDeployedspells: [
          {
            contractName: spell.name,
            spellUUID: this.props.match.params.spellUUID,
            contractAddress: contract,
          },
        ],
      };
      await setProfiles(newUserProfile);
    } else {
      userProfile.userDeployedspells.push({
        contractName: spell.name,
        spellUUID: this.props.match.params.spellUUID,
        contractAddress: contract,
      });
      const updatedProfiles = await updateProfiles(userProfile);
      console.log("Successfully Updated", updatedProfiles);
    }
  };

  withdrawAsset = async () => {
    console.log("this.state", this.state);
    const web3 = await getWeb3Instance();
    const spellID = this.props.match.params.spellUUID;
    console.log(spellID, "spellID");
    const spell = await getspell(spellID);
    const contractAddress = this.props.location.state
      ? this.props.location.state.contractAddress
      : this.state.contract;
    const withdrawInstance = await withdraw(
      contractAddress,
      spell.contractABI,
      this.state.asset
    );

    withdrawInstance.methods
      .withdraw(this.state.asset)
      .send(
        {
          from: await defaultAddress(),
          gas: web3.utils.toHex(222000),
          gasPrice: web3.utils.toHex(web3.utils.toWei("100", "gwei")),
        },
        (err, txh) => {
          console.log(txh, err);
        }
      )
      .on("error", (error) => {
        console.log("error", error);
        this.setState({ withdrawTransactionStatus: "failed" });
      })
      .on("transactionHash", (withdrawTransactionHash) => {
        this.setState({ withdrawTransactionHash: withdrawTransactionHash });
        console.log(withdrawTransactionHash);
      })
      .then((res) => {
        this.setState({ withdrawTransactionStatus: "done" });
      });
  };

  render() {
    return (
      <div>
        {this.state.currentspell ? (
          <div>
            <Container className="main-container">
              <Row>
                <Col sm="12" md="4" lg="3">
                  <Card className="Card">
                    <center>
                      <CardBody>
                        <CardTitle className="CardTitle">
                          {this.state.currentspell.name}
                        </CardTitle>
                        <p className="CardDescription">
                          {this.state.currentspell.description}
                        </p>
                        <br />
                        Made By
                        {this.state.currentspell.rewardFeeAddress ? (
                          <div>
                            <img
                              src={makeBlockie(
                                this.state.currentspell.rewardFeeAddress
                              )}
                              alt="address blockie"
                              className="address-blockie"
                              width="15"
                            />
                            <span className="short-address">
                              {getShortAddress(
                                this.state.currentspell.rewardFeeAddress
                              )}
                            </span>
                          </div>
                        ) : (
                          <div>
                            <img
                              src={makeBlockie(
                                "0x22d491Bde2303f2f43325b2108D26f1eAbA1e32b"
                              )}
                              alt="address blockie"
                              className="address-blockie"
                              width="15"
                            />
                            <span className="short-address">
                              {getShortAddress(
                                "0x22d491Bde2303f2f43325b2108D26f1eAbA1e32b"
                              )}
                            </span>
                          </div>
                        )}
                        <br />
                        <div>
                          <div className="Votes1">
                            <button
                              value={this.state.currentspell.id}
                              className="UpVote"
                              onClick={this.upVotespell}
                            >
                              <FontAwesomeIcon icon={faThumbsUp} />
                            </button>
                          </div>
                          <span className="UpNumber">
                            {this.state.currentspell.upVotes}
                          </span>

                          <div className="Votes2">
                            <button
                              value={this.state.currentspell.id}
                              className="DownVote"
                              onClick={this.downVotespell}
                            >
                              <FontAwesomeIcon icon={faThumbsDown} />
                            </button>
                          </div>
                          <span className="DownNumber">
                            {this.state.currentspell.downVotes}
                          </span>
                        </div>
                        <br />
                      </CardBody>
                      <CardFooter className="CardFooter">
                        <Button
                          outline
                          pill
                          theme="info"
                          className="UseButton"
                          name={this.state.currentspell.id}
                          onClick={(e) => {
                            this.setState({ currentTab: "UseNow" });
                          }}
                        >
                          Use This &rarr;
                        </Button>
                      </CardFooter>
                    </center>
                  </Card>
                </Col>
                <Col>
                  <Nav tabs className="Tabs">
                    <NavItem>
                      <NavLink
                        className="NavLink"
                        value="Summary"
                        href="#"
                        active={this.state.currentTab === "Summary"}
                        onClick={(e) => {
                          e.preventDefault();
                          this.setState({ currentTab: "Summary" });
                          console.log("state", this.state);
                        }}
                      >
                        Summary
                      </NavLink>
                    </NavItem>
                    <NavItem>
                      <NavLink
                        className="NavLink"
                        value="Stats"
                        href="#"
                        active={this.state.currentTab === "Stats"}
                        onClick={(e) => this.setState({ currentTab: "Stats" })}
                      >
                        Stats
                      </NavLink>
                    </NavItem>
                    <NavItem>
                      <NavLink
                        className="NavLink"
                        value="UseNow"
                        href="#"
                        active={this.state.currentTab === "UseNow"}
                        onClick={(e) => {
                          e.preventDefault();
                          this.setState({ currentTab: "UseNow" });
                          console.log("state now", this.state);
                        }}
                      >
                        Use Now{" "}
                      </NavLink>
                    </NavItem>
                    <NavItem>
                      <NavLink
                        className="NavLink"
                        value="Users"
                        href="#"
                        active={this.state.currentTab === "Users"}
                        onClick={(e) => this.setState({ currentTab: "Users" })}
                      >
                        Previous Users{" "}
                      </NavLink>
                    </NavItem>
                  </Nav>
                  <Container>
                    {this.state.currentTab === "Summary" ? (
                      <div className="TabDiv">
                        <h4>Description</h4>
                        <p>{this.state.currentspell.description}</p>
                      </div>
                    ) : null}
                    {this.state.currentTab === "Stats" ? (
                      <div className="TabDiv">
                        <h4>
                          Total Upvotes <FontAwesomeIcon icon={faThumbsUp} /> :{" "}
                          {this.state.currentspell.upVotes}
                        </h4>
                        <h4>
                          Total Downvotes{" "}
                          <FontAwesomeIcon icon={faThumbsDown} /> :{" "}
                          {this.state.currentspell.downVotes}
                        </h4>
                      </div>
                    ) : null}
                    {this.state.currentTab === "Users" ? <div></div> : null}
                    {this.state.currentTab === "UseNow" ? (
                      <div className="TabDiv">
                        <Card className="UseCard">
                          <CardBody>
                            <CardTitle>
                              Transfer Ownership / Assets to DSA Account{" "}
                            </CardTitle>
                            Please perform all Post Instapool Flash Loans
                            execution operations necessary for the transaction
                            to run successfully. These might be mentioned in the
                            description of the Spells
                            {this.props.location.state &&
                            this.state.contract === "" ? (
                              <div>
                                <br />
                                Contract Address -{" "}
                                {this.props.location.state.contractAddress}
                              </div>
                            ) : (
                              <div>
                                {this.state.contract !== "" ? (
                                  <div>
                                    <br />
                                    Contract Address = {this.state.contract}
                                  </div>
                                ) : (
                                  <div>
                                  </div>
                                )}
                              </div>
                            )}
                          </CardBody>
                        </Card>
                        <Card className="UseCard">
                          <CardBody>
                            <Form>
                              <FormGroup>
                                <div>
                                  <Container>
                                    {this.state.currentspell.parameters.map(
                                      (param) => (
                                        <Row>
                                          <Col>
                                            <label
                                              className="Inline"
                                              htmlFor="#parametername"
                                            >
                                              {param.paramName}
                                            </label>
                                          </Col>
                                          <Col>
                                            <FormInput
                                              className="Inline1"
                                              name={param.paramName}
                                              placeholder="Parameter"
                                              onChange={(e) => {
                                                const paramName =
                                                  param.paramName;
                                                this.setState({
                                                  [paramName]: e.target.value,
                                                });
                                                console.log(
                                                  "parametersINput",
                                                  this.state
                                                );
                                              }}
                                            />
                                          </Col>
                                          <Col>
                                            <label className="Inline2">
                                              {param.paramType}
                                            </label>
                                          </Col>
                                        </Row>
                                      )
                                    )}
                                    <br />
                                  </Container>
                                </div>
                              </FormGroup>
                            </Form>
                            <center>
                              <Button
                                className="ButtonUse"
                                outline
                                pill
                                theme="info"
                                onClick={this.executespell}
                              >
                                Execute Spell
                              </Button>
                              <br />
                              {this.state.executeTransactionHash !== null ? (
                                <TransactionSpinner
                                  status={this.state.executeTransactionHash}
                                  txhash={this.state.executeTransactionHash}
                                />
                              ) : null}
                            </center>
                          </CardBody>
                        </Card>
                        <Card className="UseCard">
                          <CardBody>
                            <Form>
                              <FormGroup>
                                <label htmlFor="#withdraw">
                                  Withdraw Asset
                                </label>
                                <FormInput
                                  id="#username"
                                  placeholder="Asset Address"
                                  onChange={(e) => {
                                    this.setState({ asset: e.target.value });
                                  }}
                                />
                              </FormGroup>
                            </Form>
                            <center>
                              <Button
                                className="ButtonUse"
                                outline
                                pill
                                theme="info"
                                onClick={this.withdrawAsset}
                              >
                                {" "}
                                <FontAwesomeIcon
                                  className="UseIcon"
                                  icon={faDollarSign}
                                />
                                Withdraw Asset
                              </Button>
                              <br />
                              {this.state.withdrawTransactionStatus !== null ? (
                                <TransactionSpinner
                                  status={this.state.withdrawTransactionStatus}
                                  txhash={this.state.withdrawTransactionHash}
                                />
                              ) : null}
                            </center>
                          </CardBody>
                        </Card>
                      </div>
                    ) : null}
                  </Container>
                </Col>
              </Row>
            </Container>

            {/**   <Container className="main-container">
          <h4 className="Heading">{this.state.currentspell.name}</h4>
          <center>
            <Card className="FzapCard">
              <CardBody>
                <p>{this.state.currentspell.description}</p>
              </CardBody>
            </Card>

            <br/>
            <Button
              onClick={this.deploy}
            />
            <Card className="FzapCard">
              <CardBody>
                <Form>
                  <FormGroup>
                    <div>
                      <Container>
                        {
                          this.state.currentspell.parameters.map((param) =>
                            <Row>
                              <Col>

                                <label className="Inline" htmlFor="#parametername">
                                  {param.paramName}
                                </label>
                              </Col>
                              <Col>
                                <FormInput
                                  className="Inline"
                                  name={param.paramName}
                                  placeholder="Parameter"
                                  onChange={(e) => {
                                    const paramName = param.paramName
                                    this.setState({ [paramName]: e.target.value })
                                    console.log('parametersINput', this.state)
                                  }}
                                />
                              </Col>
                              <Col>
                                <label className="Inline">{param.paramType}</label>
                              </Col>
                            </Row>
                          )
                        }
                        <br/>
                      </Container>
                    </div>
                  </FormGroup>
                </Form>
                <Button onClick={this.executespell}>Execute spell</Button>
                <br/>
                <Row>
                              <Col>
                              
                                <label className="Inline" htmlFor="#parametername">
                                  Asset Address
                                </label>
                              </Col>
                              <Col>
                                <FormInput
                                  className="Inline"
                                  name="asset"
                                  placeholder="Parameter"
                                  onChange={(e) => {
                                    this.setState({ asset: e.target.value })
                                    console.log('parametersINput', this.state.asset)
                                  }}
                                />
                              </Col>
                              <Col>
                                <label className="Inline">Asset Address</label>
                              </Col>
                            </Row>
                            <br/>
                            <Button onClick={this.withdrawAsset}>withdraw</Button>
 
              </CardBody>
            </Card>
          </center>
                      </Container> */}
          </div>
        ) : (
          <Container className="main-container">
            <Col>
              <center>
                {" "}
                <GridLoader
                  size={10}
                  color={"#00b8d8"}
                  loading={this.state.buyingPoolToken}
                />
              </center>
            </Col>
          </Container>
        )}
      </div>
    );
  }
}
