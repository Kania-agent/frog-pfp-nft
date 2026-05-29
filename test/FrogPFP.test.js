const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("FrogPFP", function () {
  const NAME = "Frog PFP";
  const SYMBOL = "FROG";
  const BASE_URI = "https://api.frogpfp.com/metadata/";
  const MINT_PRICE = ethers.parseEther("0.001");
  const MAX_SUPPLY = 100;

  let frog;
  let owner, user1, user2;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();
    const FrogPFP = await ethers.getContractFactory("FrogPFP");
    frog = await FrogPFP.deploy(NAME, SYMBOL, BASE_URI);
  });

  describe("Deployment", function () {
    it("Should set the correct name and symbol", async function () {
      expect(await frog.name()).to.equal(NAME);
      expect(await frog.symbol()).to.equal(SYMBOL);
    });

    it("Should set the deployer as owner", async function () {
      expect(await frog.owner()).to.equal(owner.address);
    });

    it("Should set the correct max supply", async function () {
      expect(await frog.MAX_SUPPLY()).to.equal(MAX_SUPPLY);
    });

    it("Should set the correct mint price", async function () {
      expect(await frog.MINT_PRICE()).to.equal(MINT_PRICE);
    });
  });

  describe("Minting", function () {
    it("Should mint a single token with correct price", async function () {
      await frog.connect(user1).mint(1, { value: MINT_PRICE });
      expect(await frog.ownerOf(0)).to.equal(user1.address);
      expect(await frog.totalMinted()).to.equal(1);
    });

    it("Should mint multiple tokens in one tx", async function () {
      const qty = 5;
      await frog.connect(user1).mint(qty, { value: MINT_PRICE * BigInt(qty) });
      expect(await frog.totalMinted()).to.equal(qty);
      for (let i = 0; i < qty; i++) {
        expect(await frog.ownerOf(i)).to.equal(user1.address);
      }
    });

    it("Should revert if quantity is 0", async function () {
      await expect(
        frog.connect(user1).mint(0, { value: 0 })
      ).to.be.revertedWith("Quantity must be > 0");
    });

    it("Should revert with wrong ETH amount", async function () {
      await expect(
        frog.connect(user1).mint(1, { value: ethers.parseEther("0.002") })
      ).to.be.revertedWith("Wrong ETH amount");
    });

    it("Should revert if minting exceeds max supply", async function () {
      const largeQty = 101;
      await expect(
        frog.connect(user1).mint(largeQty, { value: MINT_PRICE * BigInt(largeQty) })
      ).to.be.revertedWith("Exceeds max supply");
    });

    it("Should mint up to MAX_SUPPLY and then revert", async function () {
      // Mint all 100 tokens in batches
      await frog.connect(user1).mint(50, { value: MINT_PRICE * BigInt(50) });
      await frog.connect(user2).mint(50, { value: MINT_PRICE * BigInt(50) });
      expect(await frog.totalMinted()).to.equal(MAX_SUPPLY);

      // Next mint should fail
      await expect(
        frog.connect(user1).mint(1, { value: MINT_PRICE })
      ).to.be.revertedWith("Exceeds max supply");
    });

    it("Should return correct tokenURI", async function () {
      await frog.connect(user1).mint(1, { value: MINT_PRICE });
      expect(await frog.tokenURI(0)).to.equal(BASE_URI + "0");
    });
  });

  describe("Base URI", function () {
    it("Should allow owner to update base URI", async function () {
      const newURI = "https://new.uri/metadata/";
      await frog.connect(owner).setBaseURI(newURI);
      await frog.connect(user1).mint(1, { value: MINT_PRICE });
      expect(await frog.tokenURI(0)).to.equal(newURI + "0");
    });

    it("Should revert if non-owner tries to set base URI", async function () {
      await expect(
        frog.connect(user1).setBaseURI("https://hacker.com/")
      ).to.be.revertedWithCustomError(frog, "OwnableUnauthorizedAccount");
    });
  });

  describe("Withdraw", function () {
    beforeEach(async function () {
      await frog.connect(user1).mint(10, { value: MINT_PRICE * BigInt(10) });
    });

    it("Should allow owner to withdraw ETH", async function () {
      const balanceBefore = await ethers.provider.getBalance(owner.address);
      const tx = await frog.connect(owner).withdraw();
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed * receipt.gasPrice;
      const balanceAfter = await ethers.provider.getBalance(owner.address);

      expect(balanceAfter).to.equal(
        balanceBefore + ethers.parseEther("0.01") - gasUsed
      );
    });

    it("Should revert if non-owner tries to withdraw", async function () {
      await expect(
        frog.connect(user1).withdraw()
      ).to.be.revertedWithCustomError(frog, "OwnableUnauthorizedAccount");
    });

    it("Should revert if no ETH to withdraw", async function () {
      await frog.connect(owner).withdraw();
      await expect(frog.connect(owner).withdraw()).to.be.revertedWith("No ETH to withdraw");
    });
  });

  describe("ERC721 Enumerable", function () {
    it("Should track total supply", async function () {
      await frog.connect(user1).mint(3, { value: MINT_PRICE * BigInt(3) });
      expect(await frog.totalSupply()).to.equal(3);
    });

    it("Should return token by index", async function () {
      await frog.connect(user1).mint(2, { value: MINT_PRICE * BigInt(2) });
      expect(await frog.tokenByIndex(0)).to.equal(0);
      expect(await frog.tokenByIndex(1)).to.equal(1);
    });

    it("Should return token of owner by index", async function () {
      await frog.connect(user1).mint(2, { value: MINT_PRICE * BigInt(2) });
      await frog.connect(user2).mint(1, { value: MINT_PRICE });
      expect(await frog.tokenOfOwnerByIndex(user1.address, 0)).to.equal(0);
      expect(await frog.tokenOfOwnerByIndex(user1.address, 1)).to.equal(1);
      expect(await frog.tokenOfOwnerByIndex(user2.address, 0)).to.equal(2);
    });
  });

  describe("ERC165", function () {
    it("Should support ERC721 interface", async function () {
      expect(await frog.supportsInterface("0x80ac58cd")).to.be.true;
    });

    it("Should support ERC721Enumerable interface", async function () {
      expect(await frog.supportsInterface("0x780e9d63")).to.be.true;
    });

    it("Should support ERC721Metadata interface", async function () {
      expect(await frog.supportsInterface("0x5b5e139f")).to.be.true;
    });
  });
});
