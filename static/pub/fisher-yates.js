//
// fisher-yates.js
// See: https://czep.net/21/obfuscate.html

// This test pre-computes all possible "shuffles" of 8 elements
// comparing the results of in-place Fisher-Yates to an iterative method.

// NOTE: using 1-based arrays in some places to simplify notation
// the 0th index of the array is just a dummy placeholder

class FisherYatesTester {
  constructor(n) {
    this.n = n;
    this.seq = Array.from({length: n+1}, (_, i) => i);
    this.runs = 0;
    this.matches = 0;
    this.results = new Map;
    this.shuffles = [];
  }

  init() {

    // pre-generate all possible shuffles
    let template = Array.from({length: this.n}, (_, i) => i + 1);
    let a = Array.from(template);

    do {
      this.shuffles.push(Array.from(a));

      // successively +1 until we max out the permutations
      let i;
      for (i = this.n - 1; i >= 0; i--) {
        if (a[i] >= this.n) {
          a[i] = template[i];
        }
        else {
          a[i]++;
          break;
        }
      }
      if (i < 0)
        break;

    } while (1);


  }

  // in-place Fisher-Yates shuffle
  shuffle1(shuf) {
    let res = Array.from(this.seq);
    for (let i = 1; i < this.n ; i++) {
      const r = shuf[i-1];
      const tmp = res[i];
      res[i] = res[r];
      res[r] = tmp;
    }
    return res.toString();
  }

  // iterative Fisher-Yates shuffle
  shuffle2(shuf) {
    let i;
    let ptr = new Map();
    let res = [0];

    for (i = 1; i < this.n ; i++) {
      const r = shuf[i-1];

      // determine which value to move to the output sequence
      if (ptr.has(r)) {
        res.push(ptr.get(r));
      }
      else {
        res.push(r);
      }

      // update the map of pointers to swapped values
      if (ptr.has(i)) {
        ptr.set(r, ptr.get(i));
        ptr.delete(i);
      }
      else {
        if (r > i) {
          ptr.set(r, i);
        }
      }
    }

    // finalize for i == n
    if (ptr.has(i)) {
      res.push(ptr.get(i));
      ptr.delete(i);
    }
    else {
      res.push(i);
    }

    if (ptr.size > 0) {
      console.log(`Failed to empty the map: ${ptr.size}`);
    }
    return res.toString();

  }

  loop() {

    for (const shuf of this.shuffles) {

      let res1 = this.shuffle1(shuf);
      let res2 = this.shuffle2(shuf);
      this.runs++;
      this.matches += res1 === res2;

      if (res1 !== res2) {
        console.log(`Results DO NOT MATCH for "${shuf.toString()}": 1 = "${res1}" 2 = "${res2}"`);
      }
      if (this.results.has(res1)) {
        console.log(`Permutation ALREADY EXISTS in map: ${res1}`);
        this.results.set(res1, 1 + this.results.get(res1));
      }
      else {
        this.results.set(res1, 1);
      }
    }

    console.log(`In ${this.runs} runs, there were ${this.matches} matches.`);
    console.log(`Number of shuffles: ${this.shuffles.length}`);
    console.log(`Number of observed permutations: ${this.results.size}`);
  }


}


function main() {


  // The argument to the tester specifies the size of the input range
  // This will generate n! permutations so keep this number smallish.
  s = new FisherYatesTester(8);
  s.init();
  s.loop();

}


document.addEventListener("DOMContentLoaded", function() {

  console.log("Ready to go.");
  const btnrun = document.getElementById('runtests');
  btnrun.addEventListener('click', function (e) {
    e.preventDefault();
    main();
  }, false);

}, false);
