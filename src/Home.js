import React from "react";
import {
  BrowserRouter as Router,
  Link,
  HashRouter,
  useHistory,
} from "react-router-dom";

import {
  Card,
  CardHeader,
  CardTitle,
  CardBody,
  Button,
  Container,
  Row,
  Col,
  CardFooter,
} from "shards-react";
import GridLoader from "react-spinners/GridLoader";
import { faThumbsDown, faThumbsUp } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import "./Home.css";

import makeBlockie from "ethereum-blockies-base64";

import { getShortAddress, getShortDescription } from "./services/utils";

import {
  getspells,
  getSpace,
  setspells,
  defaultAddress,
  upVotespell,
  downVotespell,
} from "./services";

export default class Home extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      spells: null,
    };

    this.downVotespell = this.downVotespell.bind(this);
    this.upVotespell = this.upVotespell.bind(this);
  }

  async componentDidMount() {
    await getSpace();
    let spellList = await getspells();

    console.log("spells", spellList);

    if (spellList === undefined) {
      spellList = [];
      this.setState({ spells: spellList });
    } else {
      this.setState({ spells: spellList });
    }
  }

  async downVotespell(spellID) {
    const newspells = await downVotespell(spellID);
    this.setState({ spell: newspells });
  }

  async upVotespell(spellID) {
    const newspells = await upVotespell(spellID);
    this.setState({ spell: newspells });
  }

  render() {
    return (
      <HashRouter>
        <div>
          <Container className="main-container">
            <string>
              <center>
                <h2 className="Heading">All Spells</h2>
              </center>
            </string>{" "}
            <div className="Cards">
              <Row>
                {this.state.spells ? (
                  this.state.spells.map((spell) => (
                    <div>
                      <Col sm="12" md="4" lg="3">
                        <Card className="Card">
                          <center>
                            <CardBody className="CardBody">
                              <CardTitle className="CardTitle">
                                {spell.name}
                              </CardTitle>
                              <p className="CardDescription">
                                {getShortDescription(spell.description)}
                              </p>
                              <br />
                              Made By
                              {spell.rewardFeeAddress ? (
                                <div>
                                  <img
                                    src={makeBlockie(spell.rewardFeeAddress)}
                                    alt="address blockie"
                                    className="address-blockie"
                                    width="15"
                                  />
                                  <span className="short-address">
                                    {getShortAddress(spell.rewardFeeAddress)}
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
                                    onClick={(e) => this.upVotespell(spell.id)}
                                  >
                                    <FontAwesomeIcon icon={faThumbsUp} />
                                  </button>
                                </div>
                                <span className="UpNumber">
                                  {spell.upVotes}
                                </span>

                                <div className="Votes2">
                                  <button
                                    onClick={(e) =>
                                      this.downVotespell(spell.id)
                                    }
                                  >
                                    <FontAwesomeIcon icon={faThumbsDown} />
                                  </button>
                                </div>
                                <span className="DownNumber">
                                  {spell.downVotes}
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
                                name={spell.id}
                                onClick={(e) => {
                                  this.props.history.push(
                                    "/spell/" + e.target.name
                                  );
                                }}
                              >
                                Use This &rarr;
                              </Button>
                            </CardFooter>
                          </center>
                        </Card>
                      </Col>
                    </div>
                  ))
                ) : (
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
                )}{" "}
              </Row>
            </div>
          </Container>
        </div>
      </HashRouter>
    );
  }
}
