import React from "react";
import "./NewZap.css";
import { verifyFile, verifyFileUniSwap } from "./services/FileServices";
import {
  Form,
  FormInput,
  FormGroup,
  Card,
  CardBody,
  Container,
  Row,
  Col,
  FormSelect,
  Button,
  FormTextarea,
  Alert,
} from "shards-react";
import {
  getSpace,
  setspells,
  upVotespell,
  uploadToSkynet,
  compileCode,
  getProfile,
  defaultAddress,
  setProfiles,
  updateProfiles,
  getProfiles,
} from "./services";
import {
  faUser,
  faAddressCard,
  faFileInvoice,
  faFileContract,
  faFileSignature,
  faFileAlt,
  faServer,
  faStickyNote,
  faExternalLinkAlt,
  faPlus,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { v4 as uuidv4 } from "uuid";
import TransactionModal from "./Modal";

export default class NewZap extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      name: "",
      description: "",
      parameters: [],
      currentParamName: "",
      currentParamType: "",
      filereader: null,
      skylink: null,
      spellFile: null,
      spellCode: null,
      contractABI: null,
      rewardFeeAddress: "",
      open: false,
      currentStatus: null,
      modalContent: "",
      showAlert: false,
    };

    this.addspell = this.addspell.bind(this);
    this.addParameter = this.addParameter.bind(this);
    this.handleFileChosen = this.handleFileChosen.bind(this);
    this.toggle = this.toggle.bind(this);
  }

  toggle = () => {
    this.setState({
      open: !this.state.open,
    });
  };

  addParameter = async () => {
    const parameter = {
      paramName: this.state.currentParamName,
      paramType: this.state.currentParamType,
    };

    const currentParams = this.state.parameters;
    currentParams.push(parameter);
    this.setState({ parameters: currentParams });
  };

  testUpload = async () => {
    console.log("state is", this.state);
    console.log("Uploading File to Skynet");
    if (this.state.spellFile) {
      await uploadToSkynet(this.state.spellFile);
    }
  };

  // handleFileRead = (spellFile) => {
  //   return new Promise((resolve, reject) => {
  //     const fileReader = new FileReader();
  //     fileReader.readAsText(spellFile);
  //     fileReader.onloadend = (e) => {
  //       const content = fileReader.result;
  //       var isCorrect = verifyFile(content.toString());
  //       //    var resp = verifyFileUniSwap(content.toString());
  //       console.log("isCorrect", isCorrect);
  //       if (isCorrect) {
  //         this.setState({ filereader: fileReader });
  //       }
  //       resolve(isCorrect);
  //     };
  //   });
  // };

  handleFileRead = () => {
          const content = this.state.spellCode
          var isCorrect = verifyFile(content);
          //    var resp = verifyFileUniSwap(content.toString());
          console.log("isCorrect", isCorrect);
          return isCorrect
    };

  handleFileChosen = async (e) => {
    console.log("file", e.target.files[0]);
    const file = e.target.files[0];

    
  };

  addspell = async () => {
    const isCorrect = this.handleFileRead();
    if (!isCorrect) {
      this.setState({ showAlert: true });
    } else {
      this.setState({ showAlert: false });
    }
    const userAddress = await defaultAddress();
    this.toggle();
    this.setState({
      currentStatus: "inProgress",
      modalContent: "Adding Your Spell...Please Wait",
    });
    const space = await getSpace();
    console.log(space)
    const spellUUID = uuidv4();
    let skylink;

    // if (this.state.spellFile) {
    //   skylink = await uploadToSkynet(this.state.spellFile);
    //   console.log(skylink)
    //   if (skylink === "error") {
    //     this.setState({
    //       currentStatus: "failed",
    //       modalContent: "Adding Spell Failed! Please Try Again",
    //     });
    //     return;
    //   }
    // }

    const spell = {
      id: spellUUID,
      name: this.state.name,
      description: this.state.description,
      parameters: this.state.parameters,
      voters: [],
      upVotes: 0,
      downVotes: 0,
      contractSourceSkylink: skylink,
      contractABI: this.state.contractABI,
      spellCode: this.state.spellCode,
      rewardFeeAddress: this.state.rewardFeeAddress,
    };

    let userProfile = await getProfile(userAddress);
    console.log(userProfile)
    if (!userProfile) {
      const newUserProfile = {
        address: userAddress,
        totalUpVotes: 0,
        totalDownVotes: 0,
        totalspellsCreated: 1,
        userDeployedspells: [],
      };

      await setProfiles(newUserProfile);
      console.log(newUserProfile)
    } else {
      userProfile.totalspellsCreated = userProfile.totalspellsCreated++;
      const updatedProfiles = await updateProfiles(userProfile);
      console.log("Successfully Updated");
    }

    await setspells(spell);
    console.log('setting spells')
    this.setState({
      currentStatus: "done",
      modalContent: "Spell Successfully Added",
    });
  };

  render() {
    return (
      <div className="main-container">
        {this.state.showAlert ? (
          <Alert className="fileAlert" theme="danger">
            <center>
              Spell Code Not Provided or It does not fulfill requirements
            </center>
          </Alert>
        ) : null}
        <h2 className="Heading">Add New Spells</h2>
        <center>
          <Card className="Card1">
            <CardBody>
              <Form>
                <FormGroup>
                  <label className="Lable" htmlFor="#name">
                    Name
                  </label>

                  <FormInput
                    className="Name"
                    onChange={(e) => {
                      this.setState({ name: e.target.value });
                    }}
                    placeholder=" Name"
                  />
                </FormGroup>
                <FormGroup>
                  <label className="Lable" htmlFor="#address">
                    Reward Fee Address
                  </label>
                  <FormInput
                    className="Address"
                    placeholder="Reward Fee Address"
                    onChange={(e) =>
                      this.setState({ rewardFeeAddress: e.target.value })
                    }
                  />
                </FormGroup>
                <FormGroup>
                  <label className="Lable" htmlFor="#description">
                    Description
                  </label>
                  <FormTextarea
                    className="Description"
                    id="#description"
                    placeholder="Description"
                    onChange={(e) => {
                      this.setState({
                        description: e.target.value,
                      });
                    }}
                  />
                </FormGroup>
              </Form>
            </CardBody>
          </Card>
        </center>
        <center>
          <Card className="Card1">
            <CardBody>
              <Form>
                <FormGroup>
                  <label className="Lable" htmlFor="#bytecode">
                    Spell Code{" "}
                  </label>
                  <FormTextarea
                    className="ByteCode"
                    id="#contract"
                    placeholder="Spell Code"
                    onChange={(e) => {
                      this.setState({ spellCode: e.target.value });
                    }}
                  />
                </FormGroup>

                <FormGroup>
                  <label className="Lable" htmlFor="#choose">
                  Upload Spell Code in File
                  </label>
                  <FormInput
                    className="Choose"
                    type="file"
                    id="file"
                    className="input-file"
                    accept=".txt"
                    onChange={this.handleFileChosen}
                  />
                </FormGroup>
              </Form>
            </CardBody>
          </Card>
        </center>
        <center>
          <Card className="Card1">
            <CardBody>
              <Form>
                <Row>
                  <Col>
                    <FormGroup>
                      <label className="Lable" htmlFor="#parametername">
                        Parameter Name
                      </label>
                      <FormInput
                        className="PName"
                        onChange={(e) => {
                          this.setState({
                            currentParamName: e.target.value,
                          });
                        }}
                        placeholder="Parameter Name"
                      />
                      ;
                    </FormGroup>
                  </Col>
                  <Col>
                    <FormGroup>
                      <label className="Lable" htmlFor="#type">
                        Choose The Type
                      </label>
                      <FormSelect
                        onChange={(e) => {
                          this.setState({
                            currentParamType: e.target.value,
                          });
                        }}
                      >
                        <option value="" className="Select">
                          Select Parameter Type
                        </option>
                        <option value="Address">Address</option>
                        <option value="Int">Int</option>
                        <option value="String">String </option>
                        <option value="AssetAmount">Amount of Asset</option>
                      </FormSelect>
                    </FormGroup>
                  </Col>
                  <Col>
                    <Button
                      className="AddP"
                      outline
                      pill
                      theme="info"
                      onClick={this.addParameter}
                    >
                      <FontAwesomeIcon className="Icon1" icon={faStickyNote} />
                      Add Parameter
                    </Button>
                  </Col>
                </Row>
                {this.state.parameters.length < 0 ? (
                  <div>No parameters Added</div>
                ) : (
                  <div>
                    {this.state.parameters.map((param) => (
                      <div className="NewCard1">
                        <Row>
                          <Col>
                            <h5 className="ParamHeading">
                              Parameter Name -
                              <span className="Span"> {param.paramName} </span>{" "}
                            </h5>
                          </Col>
                          <Col>
                            <h5>
                              Parameter Type -
                              <span className="Span">{param.paramType}</span>{" "}
                            </h5>
                          </Col>
                        </Row>
                      </div>
                    ))}
                  </div>
                )}
                <center>
                  <Button
                    className="AddS"
                    outline
                    pill
                    theme="info"
                    onClick={this.addspell}
                  >
                    <FontAwesomeIcon className="Icon1" icon={faPlus} />
                    Add Spells
                  </Button>
                </center>
              </Form>
            </CardBody>
          </Card>
        </center>
        <TransactionModal
          content={this.state.modalContent}
          status={this.state.currentStatus}
          open={this.state.open}
          toggle={this.toggle}
        ></TransactionModal>
      </div>
    );
  }
}
