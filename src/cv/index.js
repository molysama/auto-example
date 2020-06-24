import { cap } from "@auto.pro/core"

importClass(java.util.ArrayList)
importClass(java.util.LinkedList)
importClass(java.util.List)

importClass(org.opencv.imgcodecs.Imgcodecs)
importClass(org.opencv.imgproc.Imgproc)
importClass(org.opencv.core.Core)
importClass(org.opencv.core.CvType)

importClass(org.opencv.core.Mat)
importClass(org.opencv.core.MatOfPoint)
importClass(org.opencv.core.MatOfPoint2f)
importClass(org.opencv.core.MatOfByte)
importClass(org.opencv.core.MatOfKeyPoint)
importPackage(org.opencv.core)

importClass(org.opencv.core.Point)
importClass(org.opencv.core.Size)
importClass(org.opencv.core.Scalar)

// importPackage(org.opencv.features2d.DMatch)
importClass(org.opencv.features2d.FeatureDetector)
importClass(org.opencv.features2d.Features2d)
importClass(org.opencv.features2d.DescriptorExtractor)
importClass(org.opencv.features2d.DescriptorMatcher)
importClass(org.opencv.features2d.FastFeatureDetector)

/**
 * 测试opencv的ORB匹配算法（不理想，小尺寸图片提取不到几个特征点）
 * @param {*} src 
 * @param {*} dst 
 */
export function ORB(src, dst) {
    let fd = FeatureDetector.create(FeatureDetector.ORB)
    let de = DescriptorExtractor.create(DescriptorExtractor.ORB)
    let Matcher = DescriptorMatcher.create(DescriptorMatcher.BRUTEFORCE_L1)

    let mkp = new MatOfKeyPoint()
    fd.detect(src, mkp)
    let desc = new Mat()
    de.compute(src, mkp, desc)
    console.log("mkp, desc", mkp.size(), desc)

    let mkp2 = new MatOfKeyPoint()
    fd.detect(dst, mkp2)
    let desc2 = new Mat()
    de.compute(dst, mkp2, desc2)
    console.log("mkp2, desc2", mkp2.size(), desc2)

    let Matches = new MatOfDMatch()
    Matcher.match(desc, desc2, Matches)

    let minDist = 100
    let maxDist = 0

    let mats = Matches.toArray()
    for (let i = 0; i < mats.length; i++) {
        let dist = mats[i].distance
        if (dist < minDist) {
            minDist = dist
        }
        if (dist > maxDist) {
            maxDist = dist
        }
    }

    console.log("mats", mats)

    let goodMatch = []
    for (let i = 0; i < mats.length; i++) {
        let dist = mats[i].distance
        if (dist < 3 * minDist && dist < 0.2) {
            goodMatch.push(mats[i])
        }
    }

    console.log("goodsMatch", goodMatch)
    goodMatch.forEach((match) => console.log(match.queryIdx.pt))
}

export function findPoint() {
    var src = images.inRange(cap(), "#313841", "#313843")
}
