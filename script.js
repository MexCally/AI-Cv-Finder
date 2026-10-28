// ==========================================
// MOBILE NAVIGATION
// ==========================================

var menuToggle = document.getElementById("menuToggle");
var navigation = document.getElementById("navigation");

if (menuToggle && navigation) {
    menuToggle.addEventListener("click", function (event) {
        event.stopPropagation();

        var isOpen = navigation.classList.toggle("active");
        menuToggle.setAttribute("aria-expanded", isOpen);
        menuToggle.setAttribute(
            "aria-label",
            isOpen ? "Close navigation menu" : "Open navigation menu"
        );
        menuToggle.textContent = isOpen ? "✕" : "☰";
    });

    navigation.querySelectorAll("a").forEach(function (link) {
        link.addEventListener("click", function () {
            navigation.classList.remove("active");
            menuToggle.setAttribute("aria-expanded", "false");
            menuToggle.setAttribute("aria-label", "Open navigation menu");
            menuToggle.textContent = "☰";
        });
    });

    document.addEventListener("click", function (event) {
        if (
            !navigation.contains(event.target) &&
            !menuToggle.contains(event.target)
        ) {
            navigation.classList.remove("active");
            menuToggle.setAttribute("aria-expanded", "false");
            menuToggle.setAttribute("aria-label", "Open navigation menu");
            menuToggle.textContent = "☰";
        }
    });

    document.addEventListener("keydown", function (event) {
        if (event.key === "Escape") {
            navigation.classList.remove("active");
            menuToggle.setAttribute("aria-expanded", "false");
            menuToggle.setAttribute("aria-label", "Open navigation menu");
            menuToggle.textContent = "☰";
        }
    });
}

// ==========================================
// AUTOMATIC COPYRIGHT YEAR
// ==========================================

var copyrightYear = document.getElementById("copyrightYear");

if (copyrightYear) {
    copyrightYear.textContent = new Date().getFullYear();
}

// ==========================================
// N8N JOB SEARCH FORM
// ==========================================

// Production n8n webhook URL
const N8N_PRODUCTION_WEBHOOK_URL =
    "https://mishajudi.app.n8n.cloud/webhook/ai-recruitment-agent-intake";

function unwrapN8nResponse(data) {
    for (var depth = 0; depth < 5; depth += 1) {
        if (typeof data === "string") {
            try {
                data = JSON.parse(data);
                continue;
            } catch (error) {
                break;
            }
        }

        if (Array.isArray(data)) {
            if (data.length === 0) {
                return data;
            }

            if (data.length > 1) {
                return data;
            }

            data = data[0];
            continue;
        }

        if (!data || typeof data !== "object") {
            break;
        }

        if (Array.isArray(data.output)) {
            data = data.output[0];
            continue;
        }

        if (Array.isArray(data.content)) {
            data = data.content[0];
            continue;
        }

        if (
            Object.prototype.hasOwnProperty.call(data, "data") &&
            (Array.isArray(data.data) ||
                (data.data && typeof data.data === "object") ||
                typeof data.data === "string")
        ) {
            data = data.data;
            continue;
        }

        if (Object.prototype.hasOwnProperty.call(data, "text")) {
            data = data.text;
            continue;
        }

        break;
    }

    return data;
}

function parseJobList(value) {
    if (Array.isArray(value)) {
        return value;
    }

    if (typeof value === "string") {
        try {
            var parsedValue = JSON.parse(value);
            return Array.isArray(parsedValue) ? parsedValue : null;
        } catch (error) {
            return null;
        }
    }

    return null;
}

function getFirstJobValue(job, keys) {
    for (var index = 0; index < keys.length; index += 1) {
        var value = job[keys[index]];

        if (value !== undefined && value !== null && value !== "") {
            return value;
        }
    }

    return "";
}

function getDisplayText(value) {
    if (typeof value === "string" || typeof value === "number") {
        return String(value).trim();
    }

    return "";
}

function findResponseValue(data, keys, depth) {
    if (depth > 6 || !data || typeof data !== "object") {
        return "";
    }

    if (Array.isArray(data)) {
        for (var arrayIndex = 0; arrayIndex < data.length; arrayIndex += 1) {
            var arrayValue = findResponseValue(
                data[arrayIndex],
                keys,
                depth + 1
            );

            if (arrayValue) {
                return arrayValue;
            }
        }

        return "";
    }

    var directValue = getDisplayText(getFirstJobValue(data, keys));

    if (directValue) {
        return directValue;
    }

    var nestedKeys = ["candidate", "user", "body", "data", "output", "content", "text"];

    for (var index = 0; index < nestedKeys.length; index += 1) {
        var nestedValue = findResponseValue(
            data[nestedKeys[index]],
            keys,
            depth + 1
        );

        if (nestedValue) {
            return nestedValue;
        }
    }

    return "";
}

function normalizeJobMatch(job) {
    if (!job || typeof job !== "object" || Array.isArray(job)) {
        return null;
    }

    var title = getDisplayText(
        getFirstJobValue(job, [
            "title",
            "job_title",
            "jobTitle",
            "position",
            "role"
        ])
    );
    var applyUrl = getFirstJobValue(
        job,
        [
            "apply_url",
            "applyUrl",
            "application_url",
            "applicationUrl",
            "apply_link",
            "applyLink",
            "url",
            "link"
        ]
    );

    if (!title || typeof applyUrl !== "string") {
        return null;
    }

    var parsedUrl;

    try {
        parsedUrl = new URL(applyUrl);
    } catch (error) {
        return null;
    }

    if (parsedUrl.protocol !== "https:" && parsedUrl.protocol !== "http:") {
        return null;
    }

    var score = getFirstJobValue(
        job,
        ["match_score", "matchScore", "match_percentage", "matchPercentage", "score"]
    );

    if (typeof score === "number" && Number.isFinite(score)) {
        score = Math.round(score >= 0 && score <= 1 ? score * 100 : score) +
            "% match";
    } else if (typeof score === "string" && score.trim()) {
        var numericScore = Number(score.trim());
        score =
            Number.isFinite(numericScore) &&
            /^\d+(\.\d+)?$/.test(score.trim())
                ? Math.round(
                    numericScore >= 0 && numericScore <= 1
                        ? numericScore * 100
                        : numericScore
                ) + "% match"
                : score.trim();
    } else {
        score = "";
    }

    var summary = getDisplayText(
        getFirstJobValue(
            job,
            [
                "summary",
                "match_reason",
                "matchReason",
                "job_summary",
                "jobSummary",
                "description"
            ]
        )
    );

    return {
        title: title,
        company: getDisplayText(
            getFirstJobValue(
                job,
                ["company_name", "companyName", "company", "employer"]
            )
        ),
        location: getDisplayText(
            getFirstJobValue(job, ["location", "job_location", "jobLocation"])
        ),
        score: score,
        summary: summary,
        applyUrl: parsedUrl.href
    };
}

function createJobMatchCard(job) {
    var card = document.createElement("article");
    card.className = "job-match-card";

    var heading = document.createElement("div");
    heading.className = "job-match-heading";

    var title = document.createElement("h3");
    title.textContent = job.title;
    heading.appendChild(title);

    if (job.score) {
        var score = document.createElement("span");
        score.className = "match-score";
        score.textContent = job.score;
        heading.appendChild(score);
    }

    var details = [job.company, job.location].filter(function (value) {
        return typeof value === "string" && value.trim();
    });

    if (details.length) {
        var metadata = document.createElement("p");
        metadata.className = "job-match-metadata";
        metadata.textContent = details.join(" · ");
        card.appendChild(heading);
        card.appendChild(metadata);
    } else {
        card.appendChild(heading);
    }

    if (job.summary) {
        var summary = document.createElement("p");
        summary.className = "job-match-summary";
        summary.textContent = job.summary;
        card.appendChild(summary);
    }

    var link = document.createElement("a");
    link.className = "job-match-apply";
    link.href = job.applyUrl;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = "View job and apply →";
    card.appendChild(link);

    return card;
}

var applicationForm = document.getElementById("applicationForm");

if (applicationForm) {
    var formCard = document.getElementById("formCard");
    var applicationLayout = document.querySelector(".application-layout");
    var resultsContainer = document.getElementById("resultsContainer");
    var resultsHeading = document.getElementById("resultsHeading");
    var jobMatchesList = document.getElementById("jobMatchesList");
    var resultsSummary = document.getElementById("resultsSummary");
    var jobCount = document.getElementById("jobCount");
    var noJobMatches = document.getElementById("noJobMatches");
    var cvFile = document.getElementById("cvFile");
    var uploadTitle = document.getElementById("uploadTitle");
    var uploadDescription = document.getElementById("uploadDescription");
    var fileError = document.getElementById("fileError");
    var uploadBox = document.getElementById("uploadBox");
    var formStatus = document.getElementById("formStatus");
    var consent = document.getElementById("privacyConsent");
    var consentError = document.getElementById("consentError");
    var submitButton = document.getElementById("submitButton");
    var validationAttempted = false;
    var maxCvSize = 5 * 1024 * 1024;

    var validatedFields = [
        "fullName",
        "preferredJobTitle"
    ].map(function (id) {
        return document.getElementById(id);
    });

    function showFieldError(field, message) {
        var error = document.getElementById(field.id + "Error");

        field.setAttribute("aria-invalid", message ? "true" : "false");

        if (error) {
            error.textContent = message;
        }

        return !message;
    }

    function validateField(field) {
        var value = field.value.trim();
        var message = "";

        if (field.required && !value) {
            message = "This field is required.";
        }

        return showFieldError(field, message);
    }

    function resetStatus() {
        formStatus.hidden = true;
        formStatus.textContent = "";
    }

    cvFile.addEventListener("change", function () {
        resetStatus();
        fileError.textContent = "";

        var file = cvFile.files[0];

        if (!file) {
            uploadTitle.textContent = "Choose a PDF or DOCX file";
            uploadDescription.textContent = "";
            uploadDescription.hidden = true;
            uploadBox.style.borderColor = "";
            cvFile.setAttribute("aria-invalid", "false");
            return;
        }

        var extension = file.name.split(".").pop().toLowerCase();

        if (extension !== "pdf" && extension !== "docx") {
            fileError.textContent =
                "Unsupported file type. Please select a PDF or DOCX file.";
        } else if (file.size > maxCvSize) {
            fileError.textContent =
                "Your CV exceeds 5 MB. Please choose a smaller file.";
        } else {
            cvFile.setAttribute("aria-invalid", "false");
            uploadTitle.textContent = file.name;
            uploadDescription.textContent =
                "Selected on this device · " +
                (file.size / 1024 / 1024).toFixed(2) + " MB";
            uploadDescription.hidden = false;
            uploadBox.style.borderColor = "#138749";
        }

        if (fileError.textContent) {
            cvFile.value = "";
            cvFile.setAttribute("aria-invalid", "true");
            uploadTitle.textContent = "Choose a PDF or DOCX file";
            uploadDescription.textContent = "";
            uploadDescription.hidden = true;
            uploadBox.style.borderColor = "";
        }
    });

    consent.addEventListener("change", function () {
        if (consent.checked) {
            consentError.textContent = "";
            consent.setAttribute("aria-invalid", "false");
        }

        resetStatus();
    });

    validatedFields.forEach(function (field) {
        ["input", "change"].forEach(function (eventName) {
            field.addEventListener(eventName, function () {
                if (validationAttempted) {
                    validateField(field);
                }

                resetStatus();
            });
        });
    });

    applicationForm.addEventListener("submit", async function (event) {
        event.preventDefault();
        validationAttempted = true;
        resetStatus();

        var isValid = true;
        var firstInvalidField = null;

        validatedFields.forEach(function (field) {
            if (!validateField(field)) {
                isValid = false;

                if (!firstInvalidField) {
                    firstInvalidField = field;
                }
            }
        });

        var file = cvFile.files[0];

        if (!file) {
            fileError.textContent = "Please choose a PDF or DOCX CV file.";
            cvFile.setAttribute("aria-invalid", "true");
            isValid = false;

            if (!firstInvalidField) {
                firstInvalidField = cvFile;
            }
        }

        if (!consent.checked) {
            consentError.textContent =
                "Please check the consent box before continuing.";
            consent.setAttribute("aria-invalid", "true");
            isValid = false;

            if (!firstInvalidField) {
                firstInvalidField = consent;
            }
        } else {
            consentError.textContent = "";
            consent.setAttribute("aria-invalid", "false");
        }

        if (!applicationForm.checkValidity()) {
            isValid = false;

            if (!firstInvalidField) {
                firstInvalidField = applicationForm.querySelector(":invalid");
            }
        }

        if (!isValid) {
            if (firstInvalidField) {
                firstInvalidField.focus();
            }

            return;
        }

        submitButton.disabled = true;
        submitButton.textContent = "Searching for matches...";
        submitButton.setAttribute("aria-busy", "true");

        var webhookResponded = false;
        var webhookAcceptedSubmission = false;

        try {
            var response = await fetch(N8N_PRODUCTION_WEBHOOK_URL, {
                method: "POST",
                body: new FormData(applicationForm)
            });
            webhookResponded = true;

            if (!response.ok) {
                throw new Error("n8n returned HTTP " + response.status + ".");
            }
            webhookAcceptedSubmission = true;

            var responseText = await response.text();
            var responseData;

            try {
                responseData = JSON.parse(responseText);
            } catch (error) {
                throw new Error(
                    "n8n returned invalid JSON (HTTP " +
                    response.status + ")."
                );
            }

            var result = unwrapN8nResponse(responseData);

            if (
                !result ||
                (typeof result !== "object" && !Array.isArray(result))
            ) {
                throw new Error(
                    "The n8n response must contain an object or job list."
                );
            }

            var responseSources = [result];
            var analysisSources = [];

            if (
                responseData &&
                typeof responseData === "object" &&
                !Array.isArray(responseData)
            ) {
                analysisSources.push(responseData);
            }

            analysisSources.push(result);

            if (
                !Array.isArray(result) &&
                result.data &&
                typeof result.data === "object"
            ) {
                responseSources.push(result.data);
            }

            var rawJobs = Array.isArray(result) ? result : undefined;
            analysisSources = analysisSources.concat(responseSources.slice(1));
            var jobListKeys = [
                "top_5_jobs",
                "matches",
                "top_15_jobs",
                "job_matches",
                "jobs"
            ];

            for (var nestedIndex = 0; nestedIndex < responseSources.length;
                nestedIndex += 1) {
                var nestedData = responseSources[nestedIndex].data;

                if (typeof nestedData === "string") {
                    try {
                        nestedData = JSON.parse(nestedData);
                    } catch (error) {
                        nestedData = null;
                    }

                    if (
                        nestedData &&
                        typeof nestedData === "object" &&
                        !Array.isArray(nestedData)
                    ) {
                        analysisSources.push(nestedData);
                    }
                }
            }

            if (!rawJobs) {
                for (
                    var sourceIndex = 0;
                    sourceIndex < responseSources.length && !rawJobs;
                    sourceIndex += 1
                ) {
                    for (
                        var keyIndex = 0;
                        keyIndex < jobListKeys.length;
                        keyIndex += 1
                    ) {
                        var candidateJobs =
                            responseSources[sourceIndex][jobListKeys[keyIndex]];
                        var parsedJobs = parseJobList(candidateJobs);

                        if (parsedJobs) {
                            rawJobs = parsedJobs;
                            break;
                        }
                    }
                }
            }

            if (
                !rawJobs &&
                responseSources.some(function (source) {
                    return !Array.isArray(source) && getFirstJobValue(
                        source,
                        ["title", "job_title", "jobTitle", "position", "role"]
                    );
                })
            ) {
                rawJobs = [responseSources.find(function (source) {
                    return !Array.isArray(source) && getFirstJobValue(
                        source,
                        ["title", "job_title", "jobTitle", "position", "role"]
                    );
                })];
            }

            if (!Array.isArray(rawJobs)) {
                throw new Error("The n8n response did not include a job list.");
            }

            var jobs = rawJobs.map(normalizeJobMatch).filter(Boolean);
            var invalidJobCount = rawJobs.length - jobs.length;

            jobMatchesList.replaceChildren();
            jobs.forEach(function (job) {
                jobMatchesList.appendChild(createJobMatchCard(job));
            });

            jobCount.textContent =
                jobs.length + (jobs.length === 1 ? " match" : " matches");
            noJobMatches.hidden = jobs.length > 0;
            var analysis = getDisplayText(
                analysisSources.map(function (source) {
                    return source && !Array.isArray(source)
                        ? source.ai_analysis
                        : "";
                }).find(function (value) {
                    return getDisplayText(value);
                })
            );

            resultsSummary.textContent = analysis ||
                (jobs.length
                    ? "Review these opportunities and choose which ones to pursue."
                    : "Your search is complete.");

            if (invalidJobCount) {
                console.warn(
                    invalidJobCount +
                    " job match(es) were skipped because details or an HTTP(S) apply URL were missing."
                );
            }

            var candidateName = findResponseValue(
                responseData,
                ["candidate_name", "candidateName", "full_name", "fullName", "name"],
                0
            ) || fullName.value.trim();

            resultsHeading.textContent = candidateName
                ? "Your job matches, " + candidateName
                : "Your job matches";

            applicationForm.reset();
            formCard.hidden = true;
            applicationLayout.hidden = true;
            resultsContainer.hidden = false;
            resultsContainer.scrollIntoView({ behavior: "smooth" });
        } catch (error) {
            console.error("Job search submission failed:", error);

            if (webhookAcceptedSubmission) {
                formStatus.textContent =
                    "Your request reached the workflow, but we couldn't display the results: " +
                    (error && error.message
                        ? error.message
                        : "an unexpected response was received.") +
                    " Please try again later.";
            } else if (webhookResponded) {
                formStatus.textContent =
                    "The workflow responded with an error. Your submission may have been received; check before submitting again.";
            } else {
                formStatus.textContent =
                    "We couldn't confirm whether your submission was received. Check for results before trying again.";
            }

            formStatus.hidden = false;
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = "Find matching jobs →";
            submitButton.removeAttribute("aria-busy");
        }
    });
}
