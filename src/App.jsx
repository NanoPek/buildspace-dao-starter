import {useWeb3} from "@3rdweb/hooks";
import {ThirdwebSDK} from "@3rdweb/sdk";
import {useEffect, useMemo, useState} from "react";
import {toast} from "react-hot-toast";
import {ethers} from "ethers";
import { UnsupportedChainIdError } from "@web3-react/core";

const sdk = new ThirdwebSDK("rinkeby")



const bundleDropModule = sdk.getBundleDropModule("0x57c10d8B4626065D1d67B58EBe3324F0A9a339A0")
const tokenModule = sdk.getTokenModule("0x727775CF034d4657abcE96A2fD279BC9dF742ef8")
const voteModule = sdk.getVoteModule("0xe90dBa6766673Ca56374c6aF8920c8e70D64DcBB")

const App = () => {

    const {connectWallet, address, error, provider} = useWeb3()
    const signer = provider ? provider.getSigner() : undefined;

    const [hasClaimedNFT,setHasClaimedNFT] = useState(false);
    const [isClaiming, setIsClaiming] = useState(false)
    const [memberTokenAmounts, setMemberTokenAmounts] = useState({});
    const [memberAddresses, setMemberAddresses] = useState([]);

    const [proposals, setProposals] = useState([]);
    const [isVoting, setIsVoting] = useState(false);
    const [hasVoted, setHasVoted] = useState(false);

    const shortenAddress = (str) => {
        return str.substring(0, 6) + "..." + str.substring(str.length - 4);
    };

    const toastSuccess = (message) => {
        toast.success(message, {style: {
            background: '#f7bbcf',
            color: '#210612'
                }, iconTheme: {
                    primary: '#bbf7e3',
                    secondary: '#f7bbcf'
                }}
            )
    }

    const toastError = (message) => {
        toast.error(message, {style: {
                background: '#f7bbcf',
                color: '#210612'
            }, iconTheme: {
                primary: '#BF211E',
                secondary: '#f7bbcf'
            }}
        )
    }

    useEffect(() => {
        // We pass the signer to the sdk, which enables us to interact with
        // our deployed contract!
        sdk.setProviderOrSigner(signer);
    }, [signer]);

    useEffect(async () => {
        if (!address || isClaiming) return

        const balance = await bundleDropModule.balanceOf(address, "0")

        try {
            if(balance.gt(0)) {
                setHasClaimedNFT(true)
                console.log("You have a Yoshi to mount !")
                toastSuccess("You have a Yoshi to mount !")
            } else {
                setHasClaimedNFT(false)
                console.log("You don't have a Yoshi, mint one !")
                toastError("You don't have a Yoshi, mint one !")
            }
        } catch (error) {
            setHasClaimedNFT(false)
            console.log("Failed to NFT balance 😢 Retry !")
            console.error("failed to NFT balance",error)
        }
    }, [address])

    useEffect(async () => {
        if (!hasClaimedNFT) return

        try {
            const memberAddresses = await bundleDropModule.getAllClaimerAddresses("0")
            setMemberAddresses(memberAddresses)
        } catch (error) {
            console.error("failed to get member list",error)
        }
    }, [hasClaimedNFT])

    useEffect(async () => {
        if (!hasClaimedNFT) return

        try {
            const amounts = await tokenModule.getAllHolderBalances()
            setMemberTokenAmounts(amounts)
        } catch (error) {
            console.error("failed to get token amounts", error)
        }
    }, [hasClaimedNFT])

    useEffect(async () => {
        if (!hasClaimedNFT) return

        try {
            const proposals = await voteModule.getAll()
            setProposals(proposals)

        } catch (error) {
            console.error("failed to get proposals", error)
        }
    }, [hasClaimedNFT])

    console.log(proposals)

    useEffect(async () => {
        if (!hasClaimedNFT || !proposals.length) return

        try {
            const hasVoted = await voteModule.hasVoted(proposals[0].proposalId, address)
            setHasVoted(hasVoted)
            if (hasVoted) {
                console.log(" user has already voted")
            } else {
                console.log(" user has not voted yet")
            }
        } catch (error) {
            console.error("Failed to check if wallet has voted",error)
        }
    },[hasClaimedNFT,proposals,address])

    const memberList = useMemo(() => {
        return memberAddresses.map((address) => {
            return {
                address,
                tokenAmount: ethers.utils.formatUnits(
                    memberTokenAmounts[address] || 0,
                    18,
                )
            }
        })
    },[memberAddresses,memberTokenAmounts])

    const mintNft = async () => {
        setIsClaiming(true)
        try {
            await bundleDropModule.claim("0",1)

            setHasClaimedNFT(true)

            console.log("Your Own Yoshi successfully minted !")
            toastSuccess("Your Own Yoshi successfully minted !")
        } catch (error) {
            console.error("failed to mint", error)
            toastError("Failed to mint 😢 Retry !")
        } finally {
            setIsClaiming(false)
        }
    }

    if (error instanceof UnsupportedChainIdError ) {
        return (
            <div className="unsupported-network">
                <h2 className={"center"}>Please connect to Rinkeby</h2>
                <p className={"center"}>
                    This dapp only works on the Rinkeby network, please switch networks
                    in your connected wallet.
                </p>
            </div>
        );
    }

    if (hasClaimedNFT) {
        return (
            <div className="member-page">
                <h1>🐱‍🐉 Yoshi Owners Page</h1>
                <h3>Congratulations on being a member</h3>
                <div>
                    <div className={"list"}>
                        <h2>Member List</h2>
                        <table className="card">
                            <thead>
                            <tr>
                                <th>Address</th>
                                <th>Token Amount</th>
                            </tr>
                            </thead>
                            <tbody>
                            {memberList.map((member) => {
                                return (
                                    <tr key={member.address}>
                                        <td>{shortenAddress(member.address)}</td>
                                        <td>{member.tokenAmount}</td>
                                    </tr>
                                );
                            })}
                            </tbody>
                        </table>
                        <table className="card">
                            <thead>
                            <tr>
                                <th>Proposals</th>
                                <th>Votes</th>
                            </tr>
                            </thead>
                            <tbody>
                            {proposals.map((proposal) => {

                                return (
                                    <tr key={proposal.proposalId}>
                                        <td>{proposal.description}</td>
                                        <td>
                                            {proposal.votes.map((vote) => {
                                                return (
                                                    <p key={vote.label}>{vote.label} :  {vote.count.toString()}</p>
                                                );
                                            })}
                                        </td>
                                    </tr>
                                )
                            })}
                            </tbody>
                        </table>
                    </div>
                    <div className={"list"}>
                        <h2>Active Proposals</h2>
                        <form
                            onSubmit={async (e) => {
                                e.preventDefault();
                                e.stopPropagation();

                                //before we do async things, we want to disable the button to prevent double clicks
                                setIsVoting(true);

                                // lets get the votes from the form for the values
                                const votes = proposals.map((proposal) => {
                                    let voteResult = {
                                        proposalId: proposal.proposalId,
                                        //abstain by default
                                        vote: 2,
                                    };
                                    proposal.votes.forEach((vote) => {
                                        const elem = document.getElementById(
                                            proposal.proposalId + "-" + vote.type
                                        );

                                        if (elem.checked) {
                                            voteResult.vote = vote.type;
                                            return;
                                        }
                                    });
                                    return voteResult;
                                });

                                // first we need to make sure the user delegates their token to vote
                                try {
                                    //we'll check if the wallet still needs to delegate their tokens before they can vote
                                    const delegation = await tokenModule.getDelegationOf(address);
                                    // if the delegation is the 0x0 address that means they have not delegated their governance tokens yet
                                    if (delegation === ethers.constants.AddressZero) {
                                        //if they haven't delegated their tokens yet, we'll have them delegate them before voting
                                        await tokenModule.delegateTo(address);
                                    }
                                    // then we need to vote on the proposals
                                    try {
                                        await Promise.all(
                                            votes.map(async (vote) => {
                                                // before voting we first need to check whether the proposal is open for voting
                                                // we first need to get the latest state of the proposal
                                                const proposal = await voteModule.get(vote.proposalId);
                                                // then we check if the proposal is open for voting (state === 1 means it is open)
                                                if (proposal.state === 1) {
                                                    // if it is open for voting, we'll vote on it
                                                    return voteModule.vote(vote.proposalId, vote.vote);
                                                }
                                                // if the proposal is not open for voting we just return nothing, letting us continue
                                                return;
                                            })
                                        );
                                        try {
                                            // if any of the propsals are ready to be executed we'll need to execute them
                                            // a proposal is ready to be executed if it is in state 4
                                            await Promise.all(
                                                votes.map(async (vote) => {
                                                    // we'll first get the latest state of the proposal again, since we may have just voted before
                                                    const proposal = await voteModule.get(
                                                        vote.proposalId
                                                    );

                                                    //if the state is in state 4 (meaning that it is ready to be executed), we'll execute the proposal
                                                    if (proposal.state === 4) {
                                                        return voteModule.execute(vote.proposalId);
                                                    }
                                                })
                                            );
                                            // if we get here that means we successfully voted, so let's set the "hasVoted" state to true
                                            setHasVoted(true);
                                            // and log out a success message
                                            console.log("successfully voted");
                                        } catch (err) {
                                            console.error("failed to execute votes", err);
                                        }
                                    } catch (err) {
                                        console.error("failed to vote", err);
                                    }
                                } catch (err) {
                                    console.error("failed to delegate tokens");
                                } finally {
                                    // in *either* case we need to set the isVoting state to false to enable the button again
                                    setIsVoting(false);
                                }
                            }}
                        >
                            {proposals.map((proposal, index) => (
                                <div key={proposal.proposalId} className="card">
                                    <h5>{proposal.description}</h5>
                                    <div>
                                        {proposal.votes.map((vote) => (
                                            <div key={vote.type}>
                                                <input
                                                    type="radio"
                                                    id={proposal.proposalId + "-" + vote.type}
                                                    name={proposal.proposalId}
                                                    value={vote.type}
                                                    //default the "abstain" vote to chedked
                                                    defaultChecked={vote.type === 2}
                                                    className={"vote-input"}
                                                />
                                                <label htmlFor={proposal.proposalId + "-" + vote.type}>
                                                    {vote.label}
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                            <button disabled={isVoting || hasVoted} type="submit">
                                {isVoting
                                    ? "Voting..."
                                    : hasVoted
                                        ? "You Already Voted"
                                        : "Submit Votes"}
                            </button>
                            <small>
                                This will trigger multiple transactions that you will need to
                                sign.
                            </small>
                        </form>
                    </div>
                </div>
            </div>
        );
    };

  return (

              <div className="landing">
                  <h1>Welcome to Kirby's DAO</h1>
                  <h2>Mint Your Own FREE Yoshi Mount Membership NFT</h2>
                  {!address ? (
                      <button onClick={() => connectWallet("injected")} className="btn-hero">
                        Connect your wallet
                    </button>
                  ) : (
                      <button
                          disabled={isClaiming}
                          onClick={() => mintNft()}
                      >
                          {isClaiming ? "Minting..." : "Mint your NFT (FREE)"}
                      </button>
                  )}
              </div>
  );
};

export default App;
