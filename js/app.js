(function () {
    'use strict';

    var Lab = function (maxMark, nameLab) {
        var self = this;
        self.maxMark = ko.observable(maxMark);
        self.nameLab = ko.observable(nameLab);
        return self;
    };

    var Mark = function (mark, lab) {
        var self = this;
        self.lab = ko.observable(lab);
        if (mark < 0 || mark > parseInt(lab.maxMark()) || isNaN(parseInt(mark)) == true) { mark = 0; }
        self.mark = ko.observable(mark).extend({ number: true, min: 0, max: parseInt(lab.maxMark()) });
        return self;
    };

    var Student = function (id, firstName, lastName, email, phone, studentAccess, parentAccess, marks, labs) {
        var self = this;
        self.isSelected = ko.observable(false);
        self.id = ko.observable(id).extend({ number: true });
        self.firstName = ko.observable(firstName);
        self.lastName = ko.observable(lastName);
        self.email = ko.observable(email);
        self.phone = ko.observable(phone);
        self.studentAccess = ko.observable(studentAccess);
        self.parentAccess = ko.observable(parentAccess);
        self.marks = ko.observableArray(_.map(marks, function (mark) {
            return new Mark(mark.mark, mark.lab);
        }));
        self.labs = ko.observableArray(labs);

        self.avgMark = ko.computed(function () {
            if (self.marks().length == 0) {
                return 0;
            }
            
            var sum = 0;
            var average = 0;
            var f = true;
            sum = _.reduce(ko.toJS(self.marks()), function (sum, mark) {
                if (parseInt(mark.mark) >= 0 && parseInt(mark.mark) <= parseInt(mark.lab.maxMark)) {
                    return sum + parseInt(mark.mark);
                } else { f = false; }
            }, sum);
            if (f == false) {
                average = "Error";
            } else {
                var sumMax = 0;
                sumMax = _.reduce(ko.toJS(self.marks()), function (sumMax, mark) {
                    return sumMax + parseInt(mark.lab.maxMark);
                }, sumMax);
                average = sum * 100 / sumMax;
                if (average < 50) average = 'F';
                else if (average < 60) average = 'E';
                else if (average < 70) average = 'D';
                else if (average < 80) average = 'C';
                else if (average < 90) average = 'B';
                else average = 'A';
            }

            return average;
        });
        return self;
    };

    var ViewModel = function (students, labs) {
        var self = this;
        self.labs = ko.observableArray(_.map(labs, function (lab) {
            return new Lab(lab.maxMark, lab.nameLab);
        }));
        self.students = ko.observableArray(_.map(students, function (student) {
            var stud = new Student(student.id, student.firstName, student.lastName, student.email, student.phone, student.studentAccess, student.parentAccess, [], labs);
            _.each(student.marks, function (m, i) {
                stud.marks.push(new Mark(m.mark, self.labs()[i]));
            });
            return stud;
        }));
        self.currentId = ko.observable().extend({ number: true });
        self.currentFirstName = ko.observable();
        self.currentLastName = ko.observable();
        self.currentEmail = ko.observable();
        self.currentPhone = ko.observable();
        self.currentStudentAccess = ko.observable();
        self.currentParentAccess = ko.observable();
        self.currentMarks = ko.observableArray();

        self.currentNameLab = ko.observable();
        self.currentMaxMark = ko.observable();

        self.add = function () {
            var firstName = self.currentFirstName().trim();
            var lastName = self.currentLastName().trim();

            if (firstName != '' && lastName != '') {

                var id = self.currentId();
                var email = self.currentEmail();
                var phone = self.currentPhone();
                var studentAccess = self.currentStudentAccess();
                var parentAccess = self.currentParentAccess();

                var j_labs = self.labs().length;
                var sTudd = new Student(id, firstName, lastName, email, phone, studentAccess, parentAccess, [], labs);

                for (var i = 0; i < j_labs; i++) {
                    sTudd.marks.push(new Mark(0, self.labs()[i]));
                }

                self.students.push(sTudd);

                self.currentId('');
                self.currentFirstName('');
                self.currentLastName('');
                self.currentEmail('');
                self.currentPhone('');
                self.currentStudentAccess('');
                self.currentParentAccess('');
            };
        };

        self.remove = function (student) {
            var toDelete = _.where(self.students(), function (stud) { return stud.isSelected(); });
            _.each(toDelete, function (stud) {
                self.students.remove(stud);
            });
            document.getElementById('all').checked = false;
            self.selectAll('');
        };

        self.selectAll = ko.computed({
            read: function () {
                return !_.any(self.students(), function (student) {
                    return student.isSelected() == false;
                });
            },
            write: function (newValue) {
                _.each(self.students(), function (student) {
                    student.isSelected(newValue);
                });
            }
        });

        self.addLab = function () {
            var nameLab = self.currentNameLab().trim();
            var maxMark = self.currentMaxMark().trim();
            var marks = self.currentMarks();
            var lab = new Lab(maxMark, nameLab);
            self.labs.push(lab);
            for (var i = 0; i < self.students().length; i++) {
                self.students()[i].marks.push(new Mark(0, lab));
            }
            self.currentNameLab('');
            self.currentMaxMark('');
        };

        self.delLab = function (lab) {
            var i_st = self.students().length;
            var j_m = self.labs().length;
            var k = 0;
            for (var i = 0; i < self.students().length; i++) {
                k = 0;
                for (var j = 0; j < self.labs().length - k; j++) {
                    if (lab == self.students()[i].marks()[j].lab()) {
                        self.students()[i].marks.splice(j, 1);
                        j--;
                        k++;
                    }
                }
            }
            self.labs.remove(lab);
        };

        ko.computed(function () {
            localStorage.setItem('students-knockoutjs', ko.toJSON(self.students));
            localStorage.setItem('labs-knockoutjs', ko.toJSON(self.labs));
        }).extend({
            throttle: 500
        });

        return self;
    };

    var students = ko.utils.parseJson(localStorage.getItem('students-knockoutjs'));
    var labs = ko.utils.parseJson(localStorage.getItem('labs-knockoutjs'));

    var model = new ViewModel(students, labs);
    //var model = new ViewModel([], []);
    ko.applyBindings(model);

})();