This project is a binary clock display. It will display a clock as a series of binary lights, representing seconds, minutes and hours.
We will have a toggle switch, which switches between 4-bit and 6-bit mode.

## 4-bit mode: 
4-bits are used for the tens and another 4-bits are used for the units. So we will have 3 groups of 2x 4-bits, reading from left to right, with least significant bit at the bottom:
```
xx xx xx
xx xx xx
xx xx xx
xx xx xx
hh mm ss
```

## 6-bit mode: 
6-bits are used for each hours, minutes and seconds
```
x x x
x x x
x x x
x x x
x x x
x x x
h m s
```
And a 12/24 hour switch...

So, our 4-bit time 12:34:56 would be:
```
00 00 00
00 01 11
01 10 01
10 10 10
---------
12:34:56
```
and 6-bits:
 ```
 0  1  1
 0  0  1
 1  0  1
 1  0  0
 0  1  0
 0  0  0
-----
12:34:56
```
It's mostly going to be about the CSS. Maybe we have a grid with some circles in. Make each circle one colour for on and another colour for off. Maybe set a data-attribute value (which will be 1 or 0) and in css, we set the colour of  the circle based on the attribute value.

In JS, we need to change the data-attributes based on the current time:

6-bits: hour.toString(2), minute.toString(2) and second.toString(2).
4-bits: hmm... we'll need to seperate the digits into tens and units:
```js
let currentHour = new Date().getSeconds();
let tens = parseInt(currentHour / 10);
let units  = currentHour % 10;
console.log("FirstDigit =",tens.toString(2),"\nLastDigit =",units.toString(2));
```
![[binaryClock.mp4]]

I want to add a help section to the clock, which will explain how to read the clock and the basics of binary.  I want to show the value of the bits and the fact that we need to add them to each other:

```
 0    32   32
 0    0    16
 8    0    8
 4    0    0
 0    2    0
 0    0    0
-----
12 : 34 : 56
```

