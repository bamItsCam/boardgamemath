var cards;
var nonRollingCountTotal;
var attacks;

initCards();
initAttacks();
initCardsChart();
initAttacksChart();
updateProbabilities();

function Card(name, additionModifier, multiplierModifier, rolling, initialCount) {
    this.name = name;
    this.additionModifier = additionModifier;
    this.multiplierModifier = multiplierModifier;
    this.rolling = rolling;
    this.initialCount = initialCount;
    this.count = initialCount;
    this.probability = 0.0;
}

function initCards() {
    cards = [
        new Card("×0", 0, 0, false, 1),
        new Card("-2", -2, 1, false, 1),
        new Card("-1", -1, 1, false, 5),
        new Card("0", 0, 1, false, 6),
        new Card("+1", 1, 1, false, 5),
        new Card("+2", 2, 1, false, 1),
        new Card("+3", 3, 1, false, 0),
        new Card("+4", 4, 1, false, 0),
        new Card("×2", 0, 2, false, 1),
        new Card("r+1", 1, 0, true, 0),
        new Card("r+2", 2, 0, true, 0)
    ];
}

function resetDeck() {
    for (var i = 0; i < cards.length; i++) {
        var card = cards[i];
        card.count = card.initialCount;
    }
    updateProbabilities();
}

function updateProbabilities() {
    nonRollingCountTotal = 0;
    for (var i = 0; i < cards.length; i++) {
        var card = cards[i];
        if (!card.rolling) {
            nonRollingCountTotal += card.count;
        }
    }
    for (var i = 0; i < cards.length; i++) {
        var card = cards[i];
        if (!card.rolling) {
            // When drawing a rolling, keep drawing until we draw a non-rolling
            card.probability = card.count / nonRollingCountTotal;
        } else {
            // For every single rolling card, when drawing another rolling card of the same type, keep drawing.
            // So each single card has probability: 1 / (nonRollingCountTotal + 1)
            // So together their influence is that probability multiplied by count
            // Other proof, by example: given 4 rolling +1 cards and 10 non-rolling cards.
            // Probability 1th card: 4/14
            // Probability 2th card: 4/14 * 3/13
            // Probability 3th card: 4/14 * 3/13 * 2/12
            // Probability 4th card: 4/14 * 3/13 * 2/12 * 1/11
            // Sum probability: 4/11 which is count / (nonRollingCountTotal + 1)
            card.probability = card.count / (nonRollingCountTotal + 1);
        }
    }
    updateCardsChart();
    updateAttacks();
}

function initCardsChart() {
    outerSize = {width: 400, height: 300};
    margin = {top: 20, right: 30, bottom: 40, left: 50};
    barButtonCount = 3;
    barButtonSize = {width: 20, height: 20};
    innerSize = {width: outerSize.width - margin.left - margin.right,
        height: outerSize.height - margin.top - margin.bottom - (barButtonCount * barButtonSize.height)};

    cardsChart = d3.select(".cardsChart")
            .attr("width", outerSize.width)
            .attr("height", outerSize.height)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    xRange = d3.scaleBand()
            .domain(cards.map(function(card) { return card.name; }))
            .range([0, innerSize.width])
            .padding(0.1);
    cardsChart.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + innerSize.height + ")")
            .call(d3.axisBottom().scale(xRange));
    cardsChart.append("text")
            .attr("transform",
                    "translate(" + (innerSize.width / 2) + " ," + (innerSize.height + margin.top + 15) + ")")
            .style("text-anchor", "middle")
            .text("Card");

    yRange = d3.scaleLinear()
            .domain([0, 1])
            .range([innerSize.height, 0]);
    cardsChart.append("g")
            .attr("class", "y axis")
            .call(d3.axisLeft().scale(yRange));
    cardsChart.append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 0 - margin.left)
            .attr("x",0 - (innerSize.height / 2))
            .attr("dy", "1em")
            .style("text-anchor", "middle")
            .text("Probability (sum per attack)");

    var cardBar = cardsChart.selectAll(".cardBar")
            .data(cards)
            .enter().append("g")
            .attr("class", "cardBar");

    drawProbabilityBar = cardBar.append("rect")
            .attr("class", "drawProbability")
            .attr("x", function (card) {
                return xRange(card.name);
            })
            .attr("width", xRange.bandwidth());
    drawProbabilityText = cardBar.append("text")
            .attr("class", "drawProbability")
            .attr("x", function (card) {
                return xRange(card.name) + xRange.bandwidth() / 2;
            })
            .attr("dy", "1em")
            .style("text-anchor", "middle")
            .text("%");
    cardCountUp = createButton(cardBar, "../../website/custom/upChevron.svg",
            "Add a card",
            function (card) {
                return xRange(card.name);
            }, function (card) {
                return innerSize.height + margin.bottom;
            }, function(card) {
                if (card.count < 20) {
                    card.count++;
                }
                updateProbabilities();
            });
    cardCountText = cardBar.append("text")
            .attr("class", "barButton")
            .attr("x", function (card) {
                return xRange(card.name) + xRange.bandwidth() / 2;
            })
            .attr("y", function (card) {
                return innerSize.height + margin.bottom + barButtonSize.height;
            })
            .attr("dy", "1em")
            .style("text-anchor", "middle")
            .text("?");
    cardCountDown = createButton(cardBar, "../../website/custom/downChevron.svg",
            "Remove a card",
            function (card) {
                return xRange(card.name);
            }, function (card) {
                return innerSize.height + margin.bottom + (2 * barButtonSize.height);
            }, function(card) {
                if (card.count > 0) {
                    card.count--;
                    updateProbabilities();
                }
            });
}

function updateCardsChart() {
    drawProbabilityBar
            .attr("y", function (card) {
                return yRange(card.probability);
            })
            .attr("height", function (card) {
                return innerSize.height - yRange(card.probability);
            });
    drawProbabilityText
            .attr("y", function (card) {
                return yRange(card.probability) - 20;
            })
            .text(function (card) {
                return Math.round(card.probability * 100.0) + "%";
            });
    cardCountText
            .text(function (card) {
                return card.count.toString();
            });
}

function createButton(cardBar, svgFile, toolTip, xFunction, yFunction, clickFunction) {
    var button = cardBar.append("image")
            .attr("xlink:href", svgFile)
            .attr("class", "barButton")
            .attr("x", xFunction)
            .attr("width", xRange.bandwidth())
            .attr("y", yFunction)
            .attr("height", barButtonSize.height)
            .on("click", clickFunction)
            .append("title").text(toolTip);
    return button;
}

function Attack(baseDamage) {
    this.baseDamage = baseDamage;
    this.averageDamage = baseDamage;
}

function initAttacks() {
    attacks = [
        new Attack(0),
        new Attack(1),
        new Attack(2),
        new Attack(3),
        new Attack(4),
        new Attack(5),
        new Attack(6),
        new Attack(7),
        new Attack(8),
        new Attack(9)
    ];
}

function calculateAverageMultiplier() {
    var multiplierSum = 0.0;
    var totalCardCount = 0;
    for (var i = 0; i < cards.length; i++) {
        var card = cards[i];
        if (!card.rolling) {
            multiplierSum += card.count * card.multiplierModifier;
            totalCardCount += card.count;
        }
    }
    if (totalCardCount === 0) {
        return 1.0;
    }
    return multiplierSum / totalCardCount;
}

function updateAttacks() {
    var averageMultiplier = calculateAverageMultiplier();
    for (var i = 0; i < attacks.length; i++) {
        var attack = attacks[i];
        attack.averageDamage = 0.0;
        for (var j = 0; j < cards.length; j++) {
            var card = cards[j];
            if (card.rolling) {
                // Multipliers affect rolling card additions too
                attack.averageDamage += card.additionModifier * card.probability * averageMultiplier;
            } else {
                var damage = (attack.baseDamage + card.additionModifier) * card.multiplierModifier;
                if (damage < 0) {
                    damage = 0;
                }
                attack.averageDamage += damage * card.probability;
            }
        }
    }
    updateAttacksChart();
}

function initAttacksChart() {
    attacksOutersize = {width: 400, height: 300};
    attacksMargin = {top: 20, right: 30, bottom: 40, left: 50};
    attacksInnerSize = {width: attacksOutersize.width - attacksMargin.left - attacksMargin.right,
        height: attacksOutersize.height - attacksMargin.top - attacksMargin.bottom};

    attacksChart = d3.select(".attacksChart")
            .attr("width", attacksOutersize.width)
            .attr("height", attacksOutersize.height)
            .append("g")
            .attr("transform", "translate(" + attacksMargin.left + "," + attacksMargin.top + ")");

    attacksX = d3.scaleBand()
            .domain(attacks.map(function(attack) { return attack.baseDamage; }))
            .range([0, attacksInnerSize.width])
            .padding(0.1);
    attacksChart.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + attacksInnerSize.height + ")")
            .call(d3.axisBottom().scale(attacksX));
    attacksChart.append("text")
            .attr("transform",
                    "translate(" + (attacksInnerSize.width / 2) + " ," + (attacksInnerSize.height + attacksMargin.top + 15) + ")")
            .style("text-anchor", "middle")
            .text("Base damage");

    attacksY = d3.scaleLinear()
            .domain([0, 20])
            .range([attacksInnerSize.height, 0]);
    attacksChart.append("g")
            .attr("class", "y axis")
            .call(d3.axisLeft().scale(attacksY));
    attacksChart.append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 0 - attacksMargin.left)
            .attr("x",0 - (attacksInnerSize.height / 2))
            .attr("dy", "1em")
            .style("text-anchor", "middle")
            .text("Average damage");

    var attackBar = attacksChart.selectAll(".attackBar")
            .data(attacks)
            .enter().append("g")
            .attr("class", "attackBar");

    averageDamageBar = attackBar.append("rect")
            .attr("class", "averageDamage")
            .attr("x", function (attack) {
                return attacksX(attack.baseDamage);
            })
            .attr("width", attacksX.bandwidth());
    averageDamageText = attackBar.append("text")
            .attr("class", "averageDamage")
            .attr("x", function (attack) {
                return attacksX(attack.baseDamage) + attacksX.bandwidth() / 2;
            })
            .attr("dy", "1em")
            .style("text-anchor", "middle")
            .text("%");
}

function updateAttacksChart() {
    averageDamageBar
            .attr("y", function (attack) {
                return attacksY(attack.averageDamage);
            })
            .attr("height", function (attack) {
                return attacksInnerSize.height - attacksY(attack.averageDamage);
            });
    averageDamageText
            .attr("y", function (attack) {
                return attacksY(attack.averageDamage) - 20;
            })
            .text(function (attack) {
                return attack.averageDamage.toFixed(2);
            });
}
